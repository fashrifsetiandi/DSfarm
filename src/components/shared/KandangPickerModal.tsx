import { useState } from 'react'
import { X, Home, Check } from 'lucide-react'
import { useKandangList } from '@/hooks/useQueries'

interface Kandang {
    id: string
    kandang_code: string
    name: string
    capacity: number
    current_occupancy: number
}

interface KandangPickerModalProps {
    currentKandangId: string | null
    currentKandangCode?: string
    onSelect: (kandangId: string) => void
    onClose: () => void
}

export function KandangPickerModal({ currentKandangId, currentKandangCode, onSelect, onClose }: KandangPickerModalProps) {
    const { data: kandangList = [], isLoading: loading } = useKandangList()
    const [activeBlock, setActiveBlock] = useState<string | null>(null)

    // Extract block from kandang_code
    const getBlock = (code: string): string => {
        const match = code.match(/^(.+?)-?\d+$/)
        return match ? match[1] : code
    }

    // Get unique blocks
    const blocks = [...new Set(kandangList.map(k => getBlock(k.kandang_code)))].sort()

    // Get kandangs for active block
    const filteredKandangs = activeBlock
        ? kandangList.filter(k => getBlock(k.kandang_code) === activeBlock)
        : []

    // Get occupancy status color
    const getStatusColor = (current: number, capacity: number) => {
        if (current === 0) return { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
        if (current >= capacity) return { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700' }
        return { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <Home className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Pilih Kandang</h2>
                            {currentKandangCode && (
                                <p className="text-sm text-gray-500">Saat ini: {currentKandangCode}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Block Sidebar */}
                    <div className="w-32 border-r border-gray-200 overflow-y-auto bg-gray-50">
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => {
                                    onSelect('')
                                    onClose()
                                }}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-200 text-gray-600"
                            >
                                Tanpa Kandang
                            </button>
                            {blocks.map((block) => (
                                <button
                                    key={block}
                                    onClick={() => setActiveBlock(block)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${activeBlock === block
                                        ? 'bg-primary-600 text-white'
                                        : 'hover:bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    Blok {block}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kandang Grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : !activeBlock ? (
                            <div className="flex items-center justify-center h-32 text-gray-500">
                                <div className="text-center">
                                    <Home className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                    <p>Pilih blok di sebelah kiri</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-3">
                                {filteredKandangs.map((kandang) => {
                                    const status = getStatusColor(kandang.current_occupancy, kandang.capacity)
                                    const isSelected = kandang.id === currentKandangId
                                    return (
                                        <button
                                            key={kandang.id}
                                            onClick={() => {
                                                onSelect(kandang.id)
                                                onClose()
                                            }}
                                            className={`relative p-3 rounded-xl border-2 transition-all hover:shadow-md ${isSelected
                                                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                                                : `${status.bg} ${status.border}`
                                                }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 p-0.5 bg-primary-600 rounded-full">
                                                    <Check className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                            <Home className={`h-6 w-6 mx-auto mb-1 ${isSelected ? 'text-primary-600' : status.text}`} />
                                            <p className={`text-sm font-bold ${isSelected ? 'text-primary-700' : status.text}`}>
                                                {kandang.kandang_code}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {kandang.current_occupancy}/{kandang.capacity}
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-400"></div>
                        <span className="text-gray-600">Kosong</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-yellow-400"></div>
                        <span className="text-gray-600">Terisi</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-400"></div>
                        <span className="text-gray-600">Penuh</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
