import { useEffect } from 'react'

/**
 * Custom hook to lock body scroll when component is mounted
 * Prevents background scroll when modal/drawer is open on mobile
 */
export function useScrollLock(isActive: boolean = true) {
    useEffect(() => {
        if (!isActive) return

        // Save current scroll position and body styles
        const scrollY = window.scrollY
        const originalStyle = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            top: document.body.style.top,
            width: document.body.style.width,
        }

        // Lock scroll
        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.top = `-${scrollY}px`
        document.body.style.width = '100%'

        // Restore on cleanup
        return () => {
            document.body.style.overflow = originalStyle.overflow
            document.body.style.position = originalStyle.position
            document.body.style.top = originalStyle.top
            document.body.style.width = originalStyle.width
            window.scrollTo(0, scrollY)
        }
    }, [isActive])
}
