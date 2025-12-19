/**
 * Sync Status Indicator
 * 
 * Visual indicator showing connection and sync status.
 * - 🟢 Online & synced
 * - 🟡 Offline (pending X items)
 * - 🔄 Syncing...
 */

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { processQueue } from '@/lib/offlineSync'
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react'

interface SyncStatusIndicatorProps {
    // Compact mode for header/navbar
    compact?: boolean
    // Show in floating position
    floating?: boolean
}

export function SyncStatusIndicator({
    compact = false,
    floating = false
}: SyncStatusIndicatorProps) {
    const { isOnline, syncStatus } = useOnlineStatus()
    const { isSyncing, pendingCount } = syncStatus

    const handleManualSync = async () => {
        if (isOnline && pendingCount > 0 && !isSyncing) {
            await processQueue()
        }
    }

    // Determine status
    const getStatus = () => {
        if (!isOnline) {
            return {
                icon: WifiOff,
                label: pendingCount > 0 ? `Offline (${pendingCount} pending)` : 'Offline',
                shortLabel: pendingCount > 0 ? `${pendingCount}` : '',
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-200'
            }
        }

        if (isSyncing) {
            return {
                icon: RefreshCw,
                label: 'Menyinkronkan...',
                shortLabel: '',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                animate: true
            }
        }

        if (pendingCount > 0) {
            return {
                icon: Cloud,
                label: `${pendingCount} menunggu sync`,
                shortLabel: `${pendingCount}`,
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-200',
                clickable: true
            }
        }

        return {
            icon: Wifi,
            label: 'Online',
            shortLabel: '',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        }
    }

    const status = getStatus()
    const Icon = status.icon

    // Don't show if online and synced (unless floating which should always show)
    if (!floating && isOnline && pendingCount === 0 && !isSyncing) {
        return null
    }

    // Compact mode - just icon with optional badge
    if (compact) {
        return (
            <button
                onClick={status.clickable ? handleManualSync : undefined}
                className={`relative p-2 rounded-lg ${status.bgColor} ${status.color} 
                    ${status.clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                title={status.label}
            >
                <Icon
                    className={`h-5 w-5 ${status.animate ? 'animate-spin' : ''}`}
                />
                {status.shortLabel && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs 
                        font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {status.shortLabel}
                    </span>
                )}
            </button>
        )
    }

    // Floating mode - fixed position indicator
    if (floating) {
        return (
            <div
                className={`fixed bottom-20 right-4 z-50 flex items-center gap-2 px-3 py-2 
                    rounded-full border shadow-lg ${status.bgColor} ${status.borderColor}
                    ${status.clickable ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
                onClick={status.clickable ? handleManualSync : undefined}
            >
                <Icon
                    className={`h-4 w-4 ${status.color} ${status.animate ? 'animate-spin' : ''}`}
                />
                <span className={`text-sm font-medium ${status.color}`}>
                    {status.label}
                </span>
            </div>
        )
    }

    // Default full mode
    return (
        <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border 
                ${status.bgColor} ${status.borderColor}
                ${status.clickable ? 'cursor-pointer hover:opacity-80' : ''}`}
            onClick={status.clickable ? handleManualSync : undefined}
        >
            <Icon
                className={`h-4 w-4 ${status.color} ${status.animate ? 'animate-spin' : ''}`}
            />
            <span className={`text-sm font-medium ${status.color}`}>
                {status.label}
            </span>
        </div>
    )
}

/**
 * Simple offline banner that shows at top of page when offline
 */
export function OfflineBanner() {
    const { isOnline, syncStatus } = useOnlineStatus()
    const { pendingCount } = syncStatus

    if (isOnline) return null

    return (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
            <CloudOff className="h-4 w-4" />
            <span>
                Mode Offline
                {pendingCount > 0 && ` • ${pendingCount} data menunggu sync`}
            </span>
        </div>
    )
}
