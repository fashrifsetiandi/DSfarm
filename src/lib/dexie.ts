/**
 * Dexie.js - IndexedDB Wrapper for Offline Storage
 * 
 * Purpose:
 * - Store data locally when offline
 * - Queue mutations for sync when online
 * - Cache frequently accessed data
 */

import Dexie, { type EntityTable } from 'dexie'

// ============================================
// TYPES
// ============================================

export interface SyncQueueItem {
    id?: number
    table: string
    operation: 'insert' | 'update' | 'delete'
    payload: Record<string, unknown>
    createdAt: string
    retryCount: number
    lastError?: string
}

export interface CachedData {
    id?: number
    key: string
    data: unknown
    updatedAt: string
    expiresAt: string
}

// ============================================
// DATABASE SETUP
// ============================================

class RubyFarmDB extends Dexie {
    syncQueue!: EntityTable<SyncQueueItem, 'id'>
    cachedData!: EntityTable<CachedData, 'id'>

    constructor() {
        super('RubyFarmDB')

        this.version(1).stores({
            // Sync queue for offline mutations
            syncQueue: '++id, table, operation, createdAt',
            // Cached data for offline reads
            cachedData: '++id, key, updatedAt'
        })
    }
}

export const db = new RubyFarmDB()

// ============================================
// SYNC QUEUE HELPERS
// ============================================

/**
 * Add operation to sync queue
 */
export async function addToQueue(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    payload: Record<string, unknown>
): Promise<number> {
    const id = await db.syncQueue.add({
        table,
        operation,
        payload,
        createdAt: new Date().toISOString(),
        retryCount: 0
    })
    return id as number
}

/**
 * Get all pending sync items
 */
export async function getPendingSync(): Promise<SyncQueueItem[]> {
    return await db.syncQueue.orderBy('createdAt').toArray()
}

/**
 * Get count of pending sync items
 */
export async function getPendingSyncCount(): Promise<number> {
    return await db.syncQueue.count()
}

/**
 * Get pending inserts for a specific table (for optimistic UI)
 */
export async function getPendingInsertsByTable(table: string): Promise<Record<string, unknown>[]> {
    const items = await db.syncQueue
        .where('table')
        .equals(table)
        .filter(item => item.operation === 'insert')
        .toArray()

    return items.map((item, index) => ({
        ...item.payload,
        // Add temporary ID and pending flag
        id: `pending_${item.id || index}`,
        _isPending: true,
        _pendingId: item.id
    }))
}

/**
 * Remove item from queue after successful sync
 */
export async function removeFromQueue(id: number): Promise<void> {
    await db.syncQueue.delete(id)
}

/**
 * Update retry count for failed sync
 */
export async function incrementRetryCount(id: number, error: string): Promise<void> {
    const item = await db.syncQueue.get(id)
    const currentRetryCount = item?.retryCount ?? 0
    await db.syncQueue.update(id, {
        retryCount: currentRetryCount + 1,
        lastError: error
    })
}

/**
 * Clear all sync queue (after bulk sync success)
 */
export async function clearQueue(): Promise<void> {
    await db.syncQueue.clear()
}

// ============================================
// CACHED DATA HELPERS
// ============================================

/**
 * Cache data with expiration
 */
export async function cacheData(
    key: string,
    data: unknown,
    ttlMinutes: number = 60
): Promise<void> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000)

    // Upsert - delete existing then add
    await db.cachedData.where('key').equals(key).delete()
    await db.cachedData.add({
        key,
        data,
        updatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
    })
}

/**
 * Get cached data if not expired
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
    const cached = await db.cachedData.where('key').equals(key).first()

    if (!cached) return null

    // Check expiration
    if (new Date(cached.expiresAt) < new Date()) {
        await db.cachedData.delete(cached.id!)
        return null
    }

    return cached.data as T
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
    await db.cachedData.clear()
}
