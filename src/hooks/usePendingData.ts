/**
 * usePendingData Hook
 * 
 * Fetches pending (queued for sync) items from IndexedDB
 * to display optimistically in list views.
 */

import { useState, useEffect } from 'react'
import { getPendingInsertsByTable, db } from '@/lib/dexie'

/**
 * Get pending inserts for a table with live updates
 */
export function usePendingInserts<T = Record<string, unknown>>(table: string) {
    const [pendingItems, setPendingItems] = useState<T[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const items = await getPendingInsertsByTable(table)
                setPendingItems(items as T[])
            } catch (err) {
                console.error('[usePendingInserts] Error:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPending()

        // Subscribe to changes in syncQueue
        const subscription = db.syncQueue.hook('creating', () => {
            fetchPending()
        })
        const deleteSubscription = db.syncQueue.hook('deleting', () => {
            fetchPending()
        })

        return () => {
            // Note: Dexie hooks don't have unsubscribe, they persist
            // This is a simplified implementation
        }
    }, [table])

    return { pendingItems, isLoading }
}

/**
 * Merge server data with pending (queued) data for optimistic UI
 */
export function mergeWithPending<T extends { id: string }>(
    serverData: T[],
    pendingData: T[]
): T[] {
    // Put pending items at the top with special styling indicator
    return [...pendingData, ...serverData]
}
