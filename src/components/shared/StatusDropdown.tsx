import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Home, XCircle, ShoppingCart, Zap, Heart, Baby, Clock, TrendingUp, Target } from 'lucide-react'
import { useClickOutside } from '@/hooks/useClickOutside'

interface StatusOption {
    value: string
    label: string
    shortLabel?: string // Short label for mobile
    icon: React.ReactNode
    color: string
    bgColor: string
}

interface StatusDropdownProps {
    value: string
    options: StatusOption[]
    onChange: (value: string) => void
    disabled?: boolean
    compact?: boolean // Use short labels
}

// Status Farm Options
export const statusFarmOptions: StatusOption[] = [
    { value: 'infarm', label: 'InFarm', shortLabel: 'InFarm', icon: <Home className="h-4 w-4" />, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
    { value: 'mati', label: 'Mati', shortLabel: 'Mati', icon: <XCircle className="h-4 w-4" />, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
    { value: 'terjual', label: 'Terjual', shortLabel: 'Terjual', icon: <ShoppingCart className="h-4 w-4" />, color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
]

// Status Indukan - Jantan
export const maleStatusOptions: StatusOption[] = [
    { value: 'pejantan_aktif', label: 'Pejantan Aktif', shortLabel: 'P. Aktif', icon: <Zap className="h-4 w-4" />, color: 'text-blue-600', bgColor: 'bg-blue-500 text-white' },
    { value: 'pejantan_muda', label: 'Pejantan Muda', shortLabel: 'P. Muda', icon: <TrendingUp className="h-4 w-4" />, color: 'text-blue-500', bgColor: 'bg-blue-400 text-white' },
    { value: 'pejantan_cadangan', label: 'Pejantan Cadangan', shortLabel: 'P. Cdg', icon: <Target className="h-4 w-4" />, color: 'text-blue-400', bgColor: 'bg-blue-300 text-white' },
    { value: 'istirahat', label: 'Istirahat', shortLabel: 'Istirahat', icon: <Clock className="h-4 w-4" />, color: 'text-gray-600', bgColor: 'bg-gray-500 text-white' },
]

// Status Indukan - Betina
export const femaleStatusOptions: StatusOption[] = [
    { value: 'siap_kawin', label: 'Siap Kawin', shortLabel: 'Siap Kawin', icon: <Heart className="h-4 w-4" />, color: 'text-purple-600', bgColor: 'bg-purple-500 text-white' },
    { value: 'bunting', label: 'Bunting', shortLabel: 'Bunting', icon: <Baby className="h-4 w-4" />, color: 'text-pink-600', bgColor: 'bg-pink-600 text-white' },
    { value: 'menyusui', label: 'Menyusui', shortLabel: 'Menyusui', icon: <Heart className="h-4 w-4" />, color: 'text-red-600', bgColor: 'bg-red-500 text-white' },
    { value: 'betina_muda', label: 'Betina Muda', shortLabel: 'B. Muda', icon: <TrendingUp className="h-4 w-4" />, color: 'text-pink-500', bgColor: 'bg-pink-400 text-white' },
    { value: 'istirahat', label: 'Istirahat', shortLabel: 'Istirahat', icon: <Clock className="h-4 w-4" />, color: 'text-gray-600', bgColor: 'bg-gray-500 text-white' },
]

// Status Anakan - promosi status is set automatically via promotion feature, not manually selectable
export const offspringStatusOptions: StatusOption[] = [
    { value: 'anakan', label: 'Anakan Baru', shortLabel: 'Anakan', icon: <Baby className="h-4 w-4" />, color: 'text-green-600', bgColor: 'bg-green-500 text-white' },
    { value: 'pertumbuhan', label: 'Pertumbuhan', shortLabel: 'Tumbuh', icon: <TrendingUp className="h-4 w-4" />, color: 'text-blue-600', bgColor: 'bg-blue-500 text-white' },
    { value: 'siap_jual', label: 'Siap Jual', shortLabel: 'Siap Jual', icon: <ShoppingCart className="h-4 w-4" />, color: 'text-orange-600', bgColor: 'bg-orange-500 text-white' },
]

export function StatusDropdown({ value, options, onChange, disabled, compact }: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    useClickOutside(dropdownRef, () => setIsOpen(false), isOpen)

    const currentOption = options.find(opt => opt.value === value) || options[0]

    // Update position when dropdown opens
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const updatePosition = () => {
                if (buttonRef.current) {
                    const rect = buttonRef.current.getBoundingClientRect()
                    // Check if dropdown would go off-screen on the right
                    const menuWidth = 192 // w-48 = 12rem = 192px
                    const left = rect.left + menuWidth > window.innerWidth
                        ? window.innerWidth - menuWidth - 16
                        : rect.left
                    setMenuPosition({
                        top: rect.bottom + 4,
                        left: Math.max(8, left)
                    })
                }
            }

            updatePosition()

            // Close dropdown on scroll to prevent misalignment
            const handleScroll = () => {
                setIsOpen(false)
            }

            window.addEventListener('scroll', handleScroll, true)
            return () => window.removeEventListener('scroll', handleScroll, true)
        }
    }, [isOpen])

    // Toggle dropdown - memoized to prevent recreating
    const toggleDropdown = useCallback(() => {
        if (!disabled) {
            setIsOpen(prev => !prev)
        }
    }, [disabled])

    // Handle option select
    const handleOptionClick = useCallback((optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
    }, [onChange])

    // Determine which label to show
    const displayLabel = compact && currentOption.shortLabel
        ? currentOption.shortLabel
        : currentOption.label

    // Stop all events from propagating to parent
    const stopAllEvents = useCallback((e: React.SyntheticEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    return (
        <div
            className="relative"
            ref={dropdownRef}
            onClick={stopAllEvents}
            onTouchStart={stopAllEvents}
            onTouchEnd={stopAllEvents}
            onPointerDown={stopAllEvents}
        >
            <button
                ref={buttonRef}
                type="button"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleDropdown()
                }}
                disabled={disabled}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all whitespace-nowrap ${currentOption.bgColor
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md active:scale-95'}`}
            >
                <span className={currentOption.color}>{currentOption.icon}</span>
                <span className="text-xs font-medium">{displayLabel}</span>
                {!disabled && <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </button>

            {isOpen && (
                <div
                    className="fixed z-[9999] w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                    onClick={stopAllEvents}
                    onTouchStart={stopAllEvents}
                    onTouchEnd={stopAllEvents}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleOptionClick(option.value)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${option.value === value ? 'bg-gray-50' : ''
                                }`}
                        >
                            <span className={option.color}>{option.icon}</span>
                            <span className="text-sm text-gray-700">{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

