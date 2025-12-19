/**
 * useOfflineQuery Hook
 * 
 * Wrapper around React Query that:
 * - Caches data to IndexedDB when online
 * - Serves cached data when offline
 * - Falls back to cache if network request fails
 */

import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query'
import { useIsOnline } from './useOnlineStatus'
import { cacheData, getCachedData } from '@/lib/dexie'
import { useEffect } from 'react'

interface UseOfflineQueryOptions<TData> extends Omit<UseQueryOptions<TData, Error, TData, QueryKey>, 'queryKey' | 'queryFn'> {
    queryKey: QueryKey
    queryFn: () => Promise<TData>
    // Cache key for IndexedDB (defaults to queryKey stringified)
    cacheKey?: string
    // Time to live in minutes (default 24 hours)
    cacheTTL?: number
}

/**
 * Query hook with automatic offline caching
 */
export function useOfflineQuery<TData>({
    queryKey,
    queryFn,
    cacheKey,
    cacheTTL = 60 * 24, // 24 hours default
    ...options
}: UseOfflineQueryOptions<TData>) {
    const isOnline = useIsOnline()
    const key = cacheKey || JSON.stringify(queryKey)

    // Modified query function that handles offline
    const offlineAwareQueryFn = async (): Promise<TData> => {
        // If online, try to fetch from network
        if (isOnline) {
            try {
                const data = await queryFn()
                // Cache the result for offline use
                await cacheData(key, data, cacheTTL)
                return data
            } catch (error) {
                // Network failed even though we're "online" - try cache
                const cached = await getCachedData<TData>(key)
                if (cached !== null) {
                    return cached
                }
                throw error
            }
        }

        // If offline, try to get from cache
        const cached = await getCachedData<TData>(key)
        if (cached !== null) {
            return cached
        }

        // No cache available
        throw new Error('Data tidak tersedia offline')
    }

    const query = useQuery({
        queryKey,
        queryFn: offlineAwareQueryFn,
        // Keep stale data when offline
        staleTime: isOnline ? (options.staleTime ?? 5 * 60 * 1000) : Infinity,
        // Don't retry when offline
        retry: isOnline ? (options.retry ?? 1) : false,
        // Keep cache longer when offline
        gcTime: isOnline ? (options.gcTime ?? 10 * 60 * 1000) : Infinity,
        ...options,
    })

    return {
        ...query,
        isOfflineData: !isOnline && query.data !== undefined,
    }
}

/**
 * Simpler hook for settings/master data that rarely changes
 * Uses longer cache TTL (7 days)
 */
export function useOfflineMasterData<TData>({
    queryKey,
    queryFn,
    cacheKey,
    ...options
}: Omit<UseOfflineQueryOptions<TData>, 'cacheTTL'>) {
    return useOfflineQuery({
        queryKey,
        queryFn,
        cacheKey,
        cacheTTL: 60 * 24 * 7, // 7 days for master data
        ...options,
    })
}

/**
 * Hook to prefetch and cache critical data for offline use
 * Call this when user first logs in
 */
export function usePrefetchOfflineData() {
    const isOnline = useIsOnline()

    const prefetch = async (key: string, fetcher: () => Promise<unknown>, ttl: number = 60 * 24) => {
        if (!isOnline) return

        try {
            const data = await fetcher()
            await cacheData(key, data, ttl)
        } catch (e) {
            console.warn(`[Prefetch] Failed to cache ${key}:`, e)
        }
    }

    return { prefetch, isOnline }
}
