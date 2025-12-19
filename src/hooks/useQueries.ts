/**
 * React Query hooks for data fetching with caching
 * 
 * Benefits:
 * - Automatic caching (5 min stale time)
 * - Deduplication (multiple components = 1 request)
 * - Background refetch
 * - Optimistic updates
 * - OFFLINE SUPPORT via IndexedDB cache
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useOfflineQuery, useOfflineMasterData } from './useOfflineQuery'

// ============================================
// QUERY KEYS (for cache management)
// ============================================
export const queryKeys = {
    kandang: ['kandang'] as const,
    kandangList: ['kandang', 'list'] as const,
    kandangPage: ['kandang', 'page'] as const,
    livestock: ['livestock'] as const,
    livestockList: ['livestock', 'list'] as const,
    livestockDetail: (id: string) => ['livestock', id] as const,
    livestockGrowthLogs: (id: string) => ['livestock', id, 'growth'] as const,
    livestockHealthRecords: (id: string) => ['livestock', id, 'health'] as const,
    offspring: ['offspring'] as const,
    offspringList: ['offspring', 'list'] as const,
    offspringDetail: (id: string) => ['offspring', id] as const,
    offspringGrowthLogs: (id: string) => ['offspring', id, 'growth'] as const,
    offspringHealthRecords: (id: string) => ['offspring', id, 'health'] as const,
}

// ============================================
// KANDANG QUERIES (with offline support)
// ============================================

interface Kandang {
    id: string
    kandang_code: string
    name: string
    capacity: number
    current_occupancy: number
    location: string | null
    description: string | null
    created_at: string
}

export function useKandangList() {
    return useOfflineQuery({
        queryKey: queryKeys.kandangList,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('kandang')
                .select('id, kandang_code, name, capacity, current_occupancy')
                .order('kandang_code')

            if (error) throw error
            return (data as Kandang[]) || []
        },
        cacheKey: 'kandang_list',
    })
}

export function useKandangPage() {
    return useOfflineQuery({
        queryKey: queryKeys.kandangPage,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('kandang')
                .select('*')
                .order('kandang_code')

            if (error) throw error
            return (data as Kandang[]) || []
        },
        cacheKey: 'kandang_page',
    })
}

// ============================================
// LIVESTOCK QUERIES (with offline support)
// ============================================

export function useLivestockList() {
    return useOfflineQuery({
        queryKey: queryKeys.livestockList,
        queryFn: async () => {
            // Fetch livestock with relations
            const { data: livestockData, error: livestockError } = await supabase
                .from('livestock')
                .select(`
                    *,
                    settings_breeds (
                        breed_name,
                        breed_code
                    ),
                    mother_livestock:mother_id (
                        id_indukan
                    ),
                    father_livestock:father_id (
                        id_indukan
                    ),
                    kandang:kandang_id (
                        id,
                        kandang_code
                    )
                `)
                .order('created_at', { ascending: false })

            if (livestockError) throw livestockError

            // Fetch latest growth logs
            const { data: growthData } = await supabase
                .from('livestock_growth_logs')
                .select('livestock_id, weight_kg, measurement_date')
                .order('measurement_date', { ascending: false })

            // Map latest weight to each livestock
            const livestockWithWeight = (livestockData || []).map((item: any) => {
                const latestGrowth = (growthData as any[])?.find((g: any) => g.livestock_id === item.id)
                return {
                    ...item,
                    latest_weight: latestGrowth?.weight_kg || null
                }
            })

            return livestockWithWeight
        },
        cacheKey: 'livestock_list',
    })
}

export function useLivestockGrowthLogs(livestockId: string) {
    return useQuery({
        queryKey: queryKeys.livestockGrowthLogs(livestockId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('livestock_growth_logs')
                .select('*')
                .eq('livestock_id', livestockId)
                .order('measurement_date', { ascending: false })

            if (error) throw error
            return data || []
        },
        enabled: !!livestockId,
    })
}

export function useLivestockHealthRecords(livestockId: string) {
    return useQuery({
        queryKey: queryKeys.livestockHealthRecords(livestockId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('livestock_health_records')
                .select('*')
                .eq('livestock_id', livestockId)
                .order('record_date', { ascending: false })

            if (error) throw error
            return data || []
        },
        enabled: !!livestockId,
    })
}

// ============================================
// OFFSPRING QUERIES (with offline support)
// ============================================

// Status calculation helper
const infarmStatuses = ['anakan', 'pertumbuhan', 'siap_jual']

const getStatusByAge = (birthDate: string): string => {
    const birth = new Date(birthDate)
    const now = new Date()

    const yearDiff = now.getFullYear() - birth.getFullYear()
    const monthDiff = now.getMonth() - birth.getMonth()
    const ageInMonths = yearDiff * 12 + monthDiff
    const dayDiff = now.getDate() - birth.getDate()
    const adjustedMonths = dayDiff < 0 ? ageInMonths - 1 : ageInMonths

    if (adjustedMonths < 1) return 'anakan'
    if (adjustedMonths < 3) return 'pertumbuhan'
    return 'siap_jual'
}

export function useOffspringList() {
    return useOfflineQuery({
        queryKey: queryKeys.offspringList,
        queryFn: async () => {
            // Fetch offspring data
            const { data, error } = await supabase
                .from('offspring')
                .select(`
                    *,
                    mother_livestock:mother_id (
                        id_indukan
                    ),
                    father_livestock:father_id (
                        id_indukan
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Fetch latest growth logs
            const { data: growthData } = await supabase
                .from('offspring_growth_logs')
                .select('offspring_id, weight_kg, measurement_date')
                .order('measurement_date', { ascending: false })

            // Process data with computed status
            const processedData = ((data || []) as any[]).map(item => {
                const latestGrowth = (growthData as any[])?.find((g: any) => g.offspring_id === item.id)

                let displayStatus = item.status_farm
                if (infarmStatuses.includes(item.status_farm)) {
                    displayStatus = getStatusByAge(item.birth_date)
                }

                return {
                    ...item,
                    latest_weight: latestGrowth?.weight_kg || null,
                    status_farm: displayStatus
                }
            })

            return processedData
        },
        cacheKey: 'offspring_list',
    })
}

export function useOffspringGrowthLogs(offspringId: string) {
    return useQuery({
        queryKey: queryKeys.offspringGrowthLogs(offspringId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('offspring_growth_logs')
                .select('*')
                .eq('offspring_id', offspringId)
                .order('measurement_date', { ascending: false })

            if (error) throw error
            return data || []
        },
        enabled: !!offspringId,
    })
}

export function useOffspringHealthRecords(offspringId: string) {
    return useQuery({
        queryKey: queryKeys.offspringHealthRecords(offspringId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('offspring_health_records')
                .select('*')
                .eq('offspring_id', offspringId)
                .order('record_date', { ascending: false })

            if (error) throw error
            return data || []
        },
        enabled: !!offspringId,
    })
}

// ============================================
// CACHE INVALIDATION HELPERS
// ============================================

export function useInvalidateKandang() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: queryKeys.kandang })
}

export function useInvalidateLivestock() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: queryKeys.livestock })
}

export function useInvalidateOffspring() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: queryKeys.offspring })
}
