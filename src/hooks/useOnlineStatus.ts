/**
 * useOnlineStatus Hook
 * 
 * Detects and tracks network connection status.
 */

import { useState, useEffect } from 'react'

/**
 * Simple hook for online/offline status
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
