/**
 * useSettings Hooks
 * 
 * Offline-aware hooks for fetching settings/master data:
 * - Breeds
 * - Feed Types  
 * - Finance Categories
 * 
 * These are cached for 7 days since they rarely change.
 */

import { supabase } from '@/lib/supabase'
import { useOfflineMasterData } from './useOfflineQuery'

// ============================================
// TYPES
// ============================================

export interface Breed {
    id: string
    breed_code: string
    breed_name: string
    description: string | null
}

export interface FeedType {
    id: string
    feed_code: string
    feed_name: string
    unit: string
    description: string | null
}

export interface FinanceCategory {
    id: string
    category_code: string
    category_name: string
    category_type: 'income' | 'expense'
    description: string | null
}

// ============================================
// QUERY KEYS
// ============================================

export const settingsQueryKeys = {
    breeds: ['settings', 'breeds'] as const,
    feedTypes: ['settings', 'feed_types'] as const,
    financeCategories: ['settings', 'finance_categories'] as const,
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetch breeds with offline cache (7 days)
 */
export function useBreeds() {
    return useOfflineMasterData<Breed[]>({
        queryKey: settingsQueryKeys.breeds,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('settings_breeds')
                .select('id, breed_code, breed_name, description')
                .order('breed_name')

            if (error) throw error
            return (data || []) as Breed[]
        },
        cacheKey: 'settings_breeds',
    })
}

/**
 * Fetch feed types with offline cache (7 days)
 */
export function useFeedTypes() {
    return useOfflineMasterData<FeedType[]>({
        queryKey: settingsQueryKeys.feedTypes,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('settings_feed_types')
                .select('id, feed_code, feed_name, unit, description')
                .order('feed_name')

            if (error) throw error
            return (data || []) as FeedType[]
        },
        cacheKey: 'settings_feed_types',
    })
}

/**
 * Fetch finance categories with offline cache (7 days)
 */
export function useFinanceCategories() {
    return useOfflineMasterData<FinanceCategory[]>({
        queryKey: settingsQueryKeys.financeCategories,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('settings_finance_categories')
                .select('id, category_code, category_name, category_type, description')
                .order('category_name')

            if (error) throw error
            return (data || []) as FinanceCategory[]
        },
        cacheKey: 'settings_finance_categories',
    })
}

/**
 * Filter finance categories by type
 */
export function useIncomeCaegories() {
    const { data, ...rest } = useFinanceCategories()
    return {
        data: data?.filter(c => c.category_type === 'income'),
        ...rest
    }
}

export function useExpenseCategories() {
    const { data, ...rest } = useFinanceCategories()
    return {
        data: data?.filter(c => c.category_type === 'expense'),
        ...rest
    }
}
