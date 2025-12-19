/**
 * useMutations Hook
 * 
 * Centralized mutation layer with offline support.
 * - Online: Direct Supabase call
 * - Offline: Queue to IndexedDB for later sync
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { addToQueue, getPendingSyncCount } from '@/lib/dexie'
import { useIsOnline } from './useOnlineStatus'
import { toast } from 'sonner'

export interface MutationResult<T = unknown> {
    data: T | null
    error: string | null
    isOffline: boolean
}

export interface UseMutationOptions {
    // Called after successful mutation (online or offline queue)
    onSuccess?: () => void
    // Called after error
    onError?: (error: string) => void
    // Show toast notifications
    showToast?: boolean
}

/**
 * Hook for offline-aware mutations
 */
export function useMutation<T = unknown>(options: UseMutationOptions = {}) {
    const isOnline = useIsOnline()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { onSuccess, onError, showToast = true } = options

    /**
     * Insert data to a table
     */
    const insert = useCallback(async (
        table: string,
        payload: Record<string, unknown>
    ): Promise<MutationResult<T>> => {
        setIsLoading(true)
        setError(null)

        try {
            if (isOnline) {
                // Online: Direct insert
                const { data, error: insertError } = await supabase
                    .from(table)
                    .insert(payload as any)
                    .select()
                    .single()

                if (insertError) throw insertError

                if (showToast) {
                    toast.success('Data berhasil disimpan')
                }
                onSuccess?.()

                return { data: data as T, error: null, isOffline: false }
            } else {
                // Offline: Queue for later
                await addToQueue(table, 'insert', payload)
                const pendingCount = await getPendingSyncCount()

                if (showToast) {
                    toast.info(`Tersimpan offline (${pendingCount} pending)`, {
                        description: 'Data akan di-sync saat online'
                    })
                }
                onSuccess?.()

                // Return optimistic data with temp ID
                const optimisticData = {
                    ...payload,
                    id: `temp_${Date.now()}`,
                    _isOffline: true
                } as T

                return { data: optimisticData, error: null, isOffline: true }
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Terjadi kesalahan'
            setError(errorMessage)

            if (showToast) {
                toast.error('Gagal menyimpan', { description: errorMessage })
            }
            onError?.(errorMessage)

            return { data: null, error: errorMessage, isOffline: false }
        } finally {
            setIsLoading(false)
        }
    }, [isOnline, onSuccess, onError, showToast])

    /**
     * Update data in a table
     */
    const update = useCallback(async (
        table: string,
        id: string,
        payload: Record<string, unknown>
    ): Promise<MutationResult<T>> => {
        setIsLoading(true)
        setError(null)

        try {
            if (isOnline) {
                // Online: Direct update
                const { data, error: updateError } = await supabase
                    .from(table)
                    .update(payload as any)
                    .eq('id', id)
                    .select()
                    .single()

                if (updateError) throw updateError

                if (showToast) {
                    toast.success('Data berhasil diperbarui')
                }
                onSuccess?.()

                return { data: data as T, error: null, isOffline: false }
            } else {
                // Offline: Queue for later
                await addToQueue(table, 'update', { id, ...payload })
                const pendingCount = await getPendingSyncCount()

                if (showToast) {
                    toast.info(`Tersimpan offline (${pendingCount} pending)`, {
                        description: 'Data akan di-sync saat online'
                    })
                }
                onSuccess?.()

                return {
                    data: { id, ...payload, _isOffline: true } as T,
                    error: null,
                    isOffline: true
                }
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Terjadi kesalahan'
            setError(errorMessage)

            if (showToast) {
                toast.error('Gagal memperbarui', { description: errorMessage })
            }
            onError?.(errorMessage)

            return { data: null, error: errorMessage, isOffline: false }
        } finally {
            setIsLoading(false)
        }
    }, [isOnline, onSuccess, onError, showToast])

    /**
     * Delete data from a table
     */
    const remove = useCallback(async (
        table: string,
        id: string
    ): Promise<MutationResult<{ id: string }>> => {
        setIsLoading(true)
        setError(null)

        try {
            if (isOnline) {
                // Online: Direct delete
                const { error: deleteError } = await supabase
                    .from(table)
                    .delete()
                    .eq('id', id)

                if (deleteError) throw deleteError

                if (showToast) {
                    toast.success('Data berhasil dihapus')
                }
                onSuccess?.()

                return { data: { id }, error: null, isOffline: false }
            } else {
                // Offline: Queue for later
                await addToQueue(table, 'delete', { id })
                const pendingCount = await getPendingSyncCount()

                if (showToast) {
                    toast.info(`Dihapus offline (${pendingCount} pending)`, {
                        description: 'Data akan di-sync saat online'
                    })
                }
                onSuccess?.()

                return { data: { id }, error: null, isOffline: true }
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Terjadi kesalahan'
            setError(errorMessage)

            if (showToast) {
                toast.error('Gagal menghapus', { description: errorMessage })
            }
            onError?.(errorMessage)

            return { data: null, error: errorMessage, isOffline: false }
        } finally {
            setIsLoading(false)
        }
    }, [isOnline, onSuccess, onError, showToast])

    /**
     * Insert multiple records at once
     */
    const insertMany = useCallback(async (
        table: string,
        payloads: Record<string, unknown>[]
    ): Promise<MutationResult<T[]>> => {
        setIsLoading(true)
        setError(null)

        try {
            if (isOnline) {
                // Online: Direct bulk insert
                const { data, error: insertError } = await supabase
                    .from(table)
                    .insert(payloads as any)
                    .select()

                if (insertError) throw insertError

                if (showToast) {
                    toast.success(`${payloads.length} data berhasil disimpan`)
                }
                onSuccess?.()

                return { data: data as T[], error: null, isOffline: false }
            } else {
                // Offline: Queue each for later
                for (const payload of payloads) {
                    await addToQueue(table, 'insert', payload)
                }
                const pendingCount = await getPendingSyncCount()

                if (showToast) {
                    toast.info(`${payloads.length} data tersimpan offline (${pendingCount} pending)`, {
                        description: 'Data akan di-sync saat online'
                    })
                }
                onSuccess?.()

                const optimisticData = payloads.map((p, i) => ({
                    ...p,
                    id: `temp_${Date.now()}_${i}`,
                    _isOffline: true
                })) as T[]

                return { data: optimisticData, error: null, isOffline: true }
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Terjadi kesalahan'
            setError(errorMessage)

            if (showToast) {
                toast.error('Gagal menyimpan', { description: errorMessage })
            }
            onError?.(errorMessage)

            return { data: null, error: errorMessage, isOffline: false }
        } finally {
            setIsLoading(false)
        }
    }, [isOnline, onSuccess, onError, showToast])

    return {
        insert,
        update,
        remove,
        insertMany,
        isLoading,
        error,
        isOnline
    }
}
