/**
 * Offline Prepare Button
 * 
 * Button that downloads all data for offline use.
 * Shows progress and completion status.
 */

import { useState, useEffect } from 'react'
import { useOfflinePrefetch, checkOfflineReadiness } from '@/hooks/useOfflinePrefetch'
import { Download, CheckCircle, WifiOff, Loader2, AlertCircle } from 'lucide-react'

interface OfflinePrepareButtonProps {
    // Full button with text
    variant?: 'full' | 'compact'
    // Show status badge
    showStatus?: boolean
}

export function OfflinePrepareButton({
    variant = 'full',
    showStatus = true
}: OfflinePrepareButtonProps) {
    const { prefetchAll, isPrefetching, progress, isOnline } = useOfflinePrefetch()
    const [isReady, setIsReady] = useState<boolean | null>(null)
    const [missingCount, setMissingCount] = useState(0)

    // Check offline readiness on mount
    useEffect(() => {
        const check = async () => {
            try {
                const result = await checkOfflineReadiness()
                setIsReady(result.isReady)
                setMissingCount(result.missingData.length)
            } catch {
                setIsReady(false)
            }
        }
        check()
    }, [progress.isComplete])

    const handlePrefetch = async () => {
        const success = await prefetchAll()
        if (success) {
            setIsReady(true)
            setMissingCount(0)
        }
    }

    // Compact variant - just icon
    if (variant === 'compact') {
        return (
            <button
                onClick={handlePrefetch}
                disabled={isPrefetching || !isOnline}
                className={`p-2 rounded-lg transition-colors ${isReady
                        ? 'bg-green-50 text-green-600'
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    } disabled:opacity-50`}
                title={isReady ? 'Data offline siap' : 'Siapkan mode offline'}
            >
                {isPrefetching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : isReady ? (
                    <CheckCircle className="h-5 w-5" />
                ) : (
                    <Download className="h-5 w-5" />
                )}
            </button>
        )
    }

    // Full variant with text and progress
    return (
        <div className="space-y-2">
            <button
                onClick={handlePrefetch}
                disabled={isPrefetching || !isOnline}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${isReady
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    } disabled:opacity-50`}
            >
                {isPrefetching ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Mengunduh data... ({progress.completed}/{progress.total})</span>
                    </>
                ) : !isOnline ? (
                    <>
                        <WifiOff className="h-5 w-5" />
                        <span>Tidak ada koneksi</span>
                    </>
                ) : isReady ? (
                    <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Data Offline Siap</span>
                    </>
                ) : (
                    <>
                        <Download className="h-5 w-5" />
                        <span>Siapkan Mode Offline</span>
                    </>
                )}
            </button>

            {/* Progress indicator */}
            {isPrefetching && (
                <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                        {progress.current}
                    </p>
                </div>
            )}

            {/* Status info */}
            {showStatus && !isPrefetching && (
                <div className="flex items-center gap-2 text-xs">
                    {isReady ? (
                        <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Semua data tersedia offline
                        </span>
                    ) : isReady === false && missingCount > 0 ? (
                        <span className="text-amber-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {missingCount} data belum tersedia offline
                        </span>
                    ) : null}
                </div>
            )}
        </div>
    )
}

/**
 * Small floating button for quick access
 */
export function OfflinePrepareFloating() {
    const { prefetchAll, isPrefetching, isOnline } = useOfflinePrefetch()
    const [isReady, setIsReady] = useState<boolean | null>(null)

    useEffect(() => {
        const check = async () => {
            try {
                const result = await checkOfflineReadiness()
                setIsReady(result.isReady)
            } catch {
                setIsReady(false)
            }
        }
        check()
    }, [])

    // Don't show if already ready
    if (isReady) return null

    return (
        <button
            onClick={prefetchAll}
            disabled={isPrefetching || !isOnline}
            className="fixed bottom-20 left-4 z-50 flex items-center gap-2 px-4 py-2 
                bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700
                disabled:opacity-50 transition-all"
        >
            {isPrefetching ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Mengunduh...</span>
                </>
            ) : (
                <>
                    <Download className="h-4 w-4" />
                    <span className="text-sm">Siapkan Offline</span>
                </>
            )}
        </button>
    )
}
