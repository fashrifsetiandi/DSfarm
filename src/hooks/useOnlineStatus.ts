/**
 * useOnlineStatus Hook
 * 
 * Detects and tracks network connection status.
 * Triggers sync when coming back online.
 */

import { useState, useEffect, useCallback } from 'react'
import { processQueue, subscribeSyncStatus, type SyncStatus } from '@/lib/offlineSync'

export interface OnlineStatus {
    isOnline: boolean
    syncStatus: SyncStatus
}

export function useOnlineStatus(): OnlineStatus {
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({
        isSyncing: false,
        pendingCount: 0,
        lastSyncAt: null,
        lastError: null
    })

    // Handle coming back online
    const handleOnline = useCallback(async () => {
        setIsOnline(true)
        // Trigger sync when coming back online
        if (syncStatus.pendingCount > 0) {
            await processQueue()
        }
    }, [syncStatus.pendingCount])

    const handleOffline = useCallback(() => {
        setIsOnline(false)
    }, [])

    useEffect(() => {
        // Add event listeners
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Subscribe to sync status
        const unsubscribe = subscribeSyncStatus(setSyncStatus)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            unsubscribe()
        }
    }, [handleOnline, handleOffline])

    return { isOnline, syncStatus }
}

/**
 * Simpler hook just for online/offline status
 */
export function useIsOnline(): boolean {
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return isOnline
}
