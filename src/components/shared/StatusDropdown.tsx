import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Home, XCircle, ShoppingCart, Zap, Heart, Baby, Clock, TrendingUp, Target } from 'lucide-react'
import { useClickOutside } from '@/hooks/useClickOutside'

interface StatusOption {
    value: string
    label: string
    icon: React.ReactNode
    color: string
    bgColor: string
}

interface StatusDropdownProps {
    value: string
    options: StatusOption[]
    onChange: (value: string) => void
    disabled?: boolean
}

// Status Farm Options
export const statusFarmOptions: StatusOption[] = [
    { value: 'infarm', label: 'InFarm', icon: <Home className="h-4 w-4" />, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
    { value: 'mati', label: 'Mati', icon: <XCircle className="h-4 w-4" />, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
    { value: 'terjual', label: 'Terjual', icon: <ShoppingCart className="h-4 w-4" />, color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
]

// Status Indukan - Jantan
export const maleStatusOptions: StatusOption[] = [
    { value: 'pejantan_aktif', label: 'Pejantan Aktif', icon: <Zap className="h-4 w-4" />, color: 'text-blue-600', bgColor: 'bg-blue-500 text-white' },
    { value: 'pejantan_muda', label: 'Pejantan Muda', icon: <TrendingUp className="h-4 w-4" />, color: 'text-blue-500', bgColor: 'bg-blue-400 text-white' },
    { value: 'pejantan_cadangan', label: 'Pejantan Cadangan', icon: <Target className="h-4 w-4" />, color: 'text-blue-400', bgColor: 'bg-blue-300 text-white' },
    { value: 'istirahat', label: 'Istirahat', icon: <Clock className="h-4 w-4" />, color: 'text-gray-600', bgColor: 'bg-gray-500 text-white' },
]

// Status Indukan - Betina
export const femaleStatusOptions: StatusOption[] = [
    { value: 'siap_kawin', label: 'Siap Kawin', icon: <Heart className="h-4 w-4" />, color: 'text-purple-600', bgColor: 'bg-purple-500 text-white' },
    { value: 'bunting', label: 'Bunting', icon: <Baby className="h-4 w-4" />, color: 'text-pink-600', bgColor: 'bg-pink-600 text-white' },
    { value: 'menyusui', label: 'Menyusui', icon: <Heart className="h-4 w-4" />, color: 'text-red-600', bgColor: 'bg-red-500 text-white' },
    { value: 'betina_muda', label: 'Betina Muda', icon: <TrendingUp className="h-4 w-4" />, color: 'text-pink-500', bgColor: 'bg-pink-400 text-white' },
    { value: 'istirahat', label: 'Istirahat', icon: <Clock className="h-4 w-4" />, color: 'text-gray-600', bgColor: 'bg-gray-500 text-white' },
]

// Status Anakan - promosi status is set automatically via promotion feature, not manually selectable
export const offspringStatusOptions: StatusOption[] = [
    { value: 'anakan', label: 'Anakan Baru', icon: <Baby className="h-4 w-4" />, color: 'text-green-600', bgColor: 'bg-green-500 text-white' },
    { value: 'pertumbuhan', label: 'Pertumbuhan', icon: <TrendingUp className="h-4 w-4" />, color: 'text-blue-600', bgColor: 'bg-blue-500 text-white' },
    { value: 'siap_jual', label: 'Siap Jual', icon: <ShoppingCart className="h-4 w-4" />, color: 'text-orange-600', bgColor: 'bg-orange-500 text-white' },
]

export function StatusDropdown({ value, options, onChange, disabled }: StatusDropdownProps) {
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
                    setMenuPosition({
                        top: rect.bottom + 4,
                        left: rect.left
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${currentOption.bgColor
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
            >
                <span className={currentOption.color}>{currentOption.icon}</span>
                <span className="text-xs font-medium">{currentOption.label}</span>
                {!disabled && <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </button>

            {isOpen && (
                <div
                    className="fixed z-[9999] w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value)
                                setIsOpen(false)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${option.value === value ? 'bg-gray-50' : ''
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
