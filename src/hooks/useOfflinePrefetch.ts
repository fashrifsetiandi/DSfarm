/**
 * useOfflinePrefetch Hook
 * 
 * Prefetches all critical data for offline use.
 * Call this after login to ensure data is available offline.
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { cacheData } from '@/lib/dexie'
import { useIsOnline } from './useOnlineStatus'
import { toast } from 'sonner'

export interface PrefetchProgress {
    total: number
    completed: number
    current: string
    isComplete: boolean
}

const PREFETCH_ITEMS = [
    { key: 'settings_breeds', table: 'settings_breeds', label: 'Data Ras' },
    { key: 'settings_feed_types', table: 'settings_feed_types', label: 'Jenis Pakan' },
    { key: 'settings_finance_categories', table: 'settings_finance_categories', label: 'Kategori Keuangan' },
    { key: 'kandang_list', table: 'kandang', label: 'Data Kandang' },
    { key: 'kandang_page', table: 'kandang', label: 'Detail Kandang' },
    { key: 'livestock_list', table: 'livestock', label: 'Data Indukan' },
    { key: 'offspring_list', table: 'offspring', label: 'Data Anakan' },
] as const

/**
 * Prefetch all critical data for offline use
 */
export function useOfflinePrefetch() {
    const isOnline = useIsOnline()
    const [isPrefetching, setIsPrefetching] = useState(false)
    const [progress, setProgress] = useState<PrefetchProgress>({
        total: PREFETCH_ITEMS.length,
        completed: 0,
        current: '',
        isComplete: false,
    })

    const prefetchAll = useCallback(async (): Promise<boolean> => {
        if (!isOnline) {
            toast.error('Tidak dapat menyiapkan data offline', {
                description: 'Anda harus terhubung ke internet'
            })
            return false
        }

        setIsPrefetching(true)
        setProgress({ total: PREFETCH_ITEMS.length, completed: 0, current: '', isComplete: false })

        try {
            for (let i = 0; i < PREFETCH_ITEMS.length; i++) {
                const item = PREFETCH_ITEMS[i]
                setProgress(prev => ({ ...prev, current: item.label, completed: i }))

                try {
                    // Fetch data from Supabase
                    let query = supabase.from(item.table).select('*')

                    // Add specific ordering
                    if (item.table === 'kandang') {
                        query = query.order('kandang_code')
                    } else if (item.table === 'livestock') {
                        query = query.order('created_at', { ascending: false })
                    } else if (item.table === 'offspring') {
                        query = query.order('created_at', { ascending: false })
                    } else {
                        query = query.order('created_at', { ascending: false })
                    }

                    const { data, error } = await query
                    if (error) throw error

                    // Cache to IndexedDB (7 days for settings, 1 day for data)
                    const ttl = item.key.startsWith('settings_') ? 60 * 24 * 7 : 60 * 24
                    await cacheData(item.key, data || [], ttl)

                } catch (err) {
                    console.warn(`[Prefetch] Failed to cache ${item.key}:`, err)
                    // Continue with other items even if one fails
                }
            }

            setProgress(prev => ({ ...prev, completed: PREFETCH_ITEMS.length, isComplete: true }))
            toast.success('Data offline siap!', {
                description: `${PREFETCH_ITEMS.length} data telah disimpan untuk penggunaan offline`
            })
            return true

        } catch (error) {
            console.error('[Prefetch] Error:', error)
            toast.error('Gagal menyiapkan data offline')
            return false
        } finally {
            setIsPrefetching(false)
        }
    }, [isOnline])

    return {
        prefetchAll,
        isPrefetching,
        progress,
        isOnline,
    }
}

/**
 * Check if essential data is cached (for showing offline readiness)
 */
export async function checkOfflineReadiness(): Promise<{
    isReady: boolean
    missingData: string[]
}> {
    const { getCachedData } = await import('@/lib/dexie')
    const missingData: string[] = []

    for (const item of PREFETCH_ITEMS) {
        const cached = await getCachedData(item.key)
        if (cached === null) {
            missingData.push(item.label)
        }
    }

    return {
        isReady: missingData.length === 0,
        missingData,
    }
}
