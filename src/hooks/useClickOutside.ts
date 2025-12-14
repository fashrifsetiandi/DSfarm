import { useEffect, RefObject } from 'react'

/**
 * Custom hook to detect clicks outside of a ref element
 * Useful for closing dropdowns, modals, and floating boxes
 * 
 * @param ref - React ref to the element to detect outside clicks
 * @param handler - Callback function to execute when clicking outside
 * @param isActive - Optional boolean to enable/disable the listener
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T | null>,
    handler: () => void,
    isActive: boolean = true
) {
    useEffect(() => {
        if (!isActive) return

        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handler()
            }
        }

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside)

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [ref, handler, isActive])
}
