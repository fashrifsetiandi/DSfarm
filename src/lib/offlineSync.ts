/**
 * Offline Sync Manager
 * 
 * Handles syncing queued offline operations to Supabase
 * when connection is restored.
 */

import { supabase } from './supabase'
import {
    getPendingSync,
    removeFromQueue,
    incrementRetryCount,
    getPendingSyncCount,
    type SyncQueueItem
} from './dexie'

// Maximum retry attempts before marking as failed
const MAX_RETRIES = 5

// Sync status listeners
type SyncStatusListener = (status: SyncStatus) => void
const listeners: Set<SyncStatusListener> = new Set()

export interface SyncStatus {
    isSyncing: boolean
    pendingCount: number
    lastSyncAt: string | null
    lastError: string | null
}

let currentStatus: SyncStatus = {
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null
}

/**
 * Subscribe to sync status changes
 */
export function subscribeSyncStatus(listener: SyncStatusListener): () => void {
    listeners.add(listener)
    // Immediately notify with current status
    listener(currentStatus)
    return () => listeners.delete(listener)
}

/**
 * Update and broadcast sync status
 */
async function updateStatus(partial: Partial<SyncStatus>): Promise<void> {
    currentStatus = { ...currentStatus, ...partial }
    // Update pending count
    currentStatus.pendingCount = await getPendingSyncCount()
    listeners.forEach(listener => listener(currentStatus))
}

/**
 * Process a single sync item
 */
async function processSyncItem(item: SyncQueueItem): Promise<boolean> {
    try {
        const { table, operation, payload } = item

        switch (operation) {
            case 'insert': {
                const { error } = await supabase.from(table).insert(payload as any)
                if (error) throw error
                break
            }
            case 'update': {
                const { id, ...updateData } = payload as { id: string;[key: string]: unknown }
                const { error } = await supabase.from(table).update(updateData as any).eq('id', id)
                if (error) throw error
                break
            }
            case 'delete': {
                const { id } = payload as { id: string }
                const { error } = await supabase.from(table).delete().eq('id', id)
                if (error) throw error
                break
            }
        }

        // Success - remove from queue
        await removeFromQueue(item.id!)
        return true

    } catch (error: any) {
        // Increment retry count
        await incrementRetryCount(item.id!, error.message)

        // If max retries exceeded, log but don't block other items
        if (item.retryCount >= MAX_RETRIES) {
            console.error(`[OfflineSync] Max retries exceeded for item ${item.id}:`, error)
        }

        return false
    }
}

/**
 * Process all pending sync items
 */
export async function processQueue(): Promise<{
    success: number;
    failed: number
}> {
    // Check if already syncing
    if (currentStatus.isSyncing) {
        return { success: 0, failed: 0 }
    }

    await updateStatus({ isSyncing: true, lastError: null })

    const pendingItems = await getPendingSync()
    let success = 0
    let failed = 0

    for (const item of pendingItems) {
        // Skip items that exceeded max retries
        if (item.retryCount >= MAX_RETRIES) {
            failed++
            continue
        }

        const result = await processSyncItem(item)
        if (result) {
            success++
        } else {
            failed++
        }
    }

    await updateStatus({
        isSyncing: false,
        lastSyncAt: new Date().toISOString()
    })

    return { success, failed }
}

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
    currentStatus.pendingCount = await getPendingSyncCount()
    return currentStatus
}

/**
 * Initialize sync on app load (if online)
 */
export async function initializeSync(): Promise<void> {
    // Update pending count
    await updateStatus({})

    // If online and has pending items, start sync
    if (navigator.onLine && currentStatus.pendingCount > 0) {
        await processQueue()
    }
}
