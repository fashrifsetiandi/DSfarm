import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Trash2, Home, X, Rabbit } from 'lucide-react'
import { KandangAddForm } from '@/components/kandang/KandangAddForm'
import { useKandangPage, useInvalidateKandang } from '@/hooks/useQueries'
import { useIsOnline } from '@/hooks/useOnlineStatus'
import { toast } from 'sonner'

interface Kandang {
    id: string
    kandang_code: string
    name: string
    location: string | null
    capacity: number
    current_occupancy: number | null
    description: string | null
    created_at: string
}

interface BlockGroup {
    blockName: string
    kandangs: Kandang[]
    totalCount: number
    availableCount: number
    locations: string[]
}

// Color palette for different locations
const LOCATION_COLORS = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500', badge: 'bg-purple-100 text-purple-700' },
    { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', icon: 'text-teal-500', badge: 'bg-teal-100 text-teal-700' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
    { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', icon: 'text-pink-500', badge: 'bg-pink-100 text-pink-700' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-500', badge: 'bg-indigo-100 text-indigo-700' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'text-cyan-500', badge: 'bg-cyan-100 text-cyan-700' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-500', badge: 'bg-rose-100 text-rose-700' },
]

// Default color for kandang without location
const DEFAULT_COLOR = { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'text-gray-500', badge: 'bg-gray-100 text-gray-600' }

export function KandangPage() {
    const { data: kandangs = [], isLoading: loading } = useKandangPage()
    const invalidateKandang = useInvalidateKandang()
    const isOnline = useIsOnline()
    const [showAddForm, setShowAddForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; code: string } | null>(null)
    const [selectedKandang, setSelectedKandang] = useState<Kandang | null>(null)

    const handleDelete = async (id: string, code: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteConfirm({ id, code })
    }

    const confirmDelete = async () => {
        if (!deleteConfirm) return

        // Check if online - delete requires online connection
        if (!isOnline) {
            toast.error('Hapus data hanya bisa dilakukan saat online', {
                description: 'Sambungkan koneksi internet terlebih dahulu'
            })
            setDeleteConfirm(null)
            return
        }

        try {
            const { error } = await supabase.from('kandang').delete().eq('id', deleteConfirm.id)
            if (error) throw error
            invalidateKandang()
            toast.success('Kandang berhasil dihapus')
        } catch (err: any) {
            toast.error('Gagal menghapus: ' + err.message)
        } finally {
            setDeleteConfirm(null)
        }
    }

    // Group kandangs by block
    const groupByBlock = (kandangs: Kandang[]): BlockGroup[] => {
        const groups: Record<string, Kandang[]> = {}

        kandangs.forEach(k => {
            const blockMatch = k.kandang_code.match(/^(.+?)-?\d+$/)
            const blockName = blockMatch ? `Blok ${blockMatch[1]}` : `Blok ${k.kandang_code}`

            if (!groups[blockName]) {
                groups[blockName] = []
            }
            groups[blockName].push(k)
        })

        return Object.entries(groups).map(([blockName, kandangs]) => {
            // Get unique locations in this block
            const locations = [...new Set(kandangs.map(k => k.location || 'Tanpa Lokasi'))]

            return {
                blockName,
                kandangs: kandangs.sort((a, b) => a.kandang_code.localeCompare(b.kandang_code, undefined, { numeric: true })),
                totalCount: kandangs.length,
                availableCount: kandangs.filter(k => (k.current_occupancy || 0) < k.capacity).length,
                locations
            }
        }).sort((a, b) => a.blockName.localeCompare(b.blockName))
    }

    const filteredKandangs = kandangs.filter((k) =>
        k.kandang_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const blockGroups = groupByBlock(filteredKandangs)

    // Get color for a location within a block
    const getLocationColor = (location: string | null, locations: string[]) => {
        const loc = location || 'Tanpa Lokasi'
        const index = locations.indexOf(loc)
        if (index === -1 || index >= LOCATION_COLORS.length) {
            return DEFAULT_COLOR
        }
        return LOCATION_COLORS[index]
    }

    // Status indicators based on occupancy
    const getStatusIndicator = (occupancy: number, capacity: number) => {
        if (occupancy === 0) return { dot: 'bg-green-500', label: 'Kosong' }
        if (occupancy >= capacity) return { dot: 'bg-red-500', label: 'Penuh' }
        return { dot: 'bg-yellow-500', label: 'Terisi' }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manajemen Kandang</h1>
                        <p className="text-sm sm:text-base text-gray-600">Total {kandangs.length} kandang</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white text-sm sm:text-base rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Tambah Kandang</span>
                        <span className="sm:hidden">Tambah</span>
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari kode, nama, atau lokasi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <KandangAddForm
                        onClose={() => setShowAddForm(false)}
                        onSuccess={() => {
                            invalidateKandang()
                            setShowAddForm(false)
                        }}
                    />
                )}

                {/* Empty State */}
                {blockGroups.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">
                            {searchTerm ? 'Tidak ada kandang yang cocok' : 'Belum ada data kandang'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Tambah kandang pertama
                            </button>
                        )}
                    </div>
                ) : (
                    /* Block Groups */
                    <div className="space-y-8">
                        {blockGroups.map((group) => (
                            <div key={group.blockName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Block Header */}
                                <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-700 rounded-xl text-lg font-bold">
                                                {group.totalCount}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">{group.blockName}</h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {group.locations.map((loc, idx) => {
                                                        const color = LOCATION_COLORS[idx] || DEFAULT_COLOR
                                                        return (
                                                            <span key={loc} className={`text-xs px-2 py-0.5 rounded-full ${color.badge}`}>
                                                                {loc}
                                                            </span>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-green-600">{group.availableCount}</span>
                                            <p className="text-xs text-gray-500">tersedia</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Kandang Cards Grid */}
                                <div className="p-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                        {group.kandangs.map((kandang) => {
                                            const occupancy = kandang.current_occupancy || 0
                                            const color = getLocationColor(kandang.location, group.locations)
                                            const status = getStatusIndicator(occupancy, kandang.capacity)

                                            return (
                                                <div
                                                    key={kandang.id}
                                                    onClick={() => setSelectedKandang(kandang)}
                                                    className={`relative ${color.bg} border-2 ${color.border} rounded-xl p-3 hover:shadow-lg transition-all duration-200 group cursor-pointer`}
                                                >
                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={(e) => handleDelete(kandang.id, kandang.kandang_code, e)}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-white text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>

                                                    {/* Status Dot */}
                                                    <div className={`absolute top-2 right-2 w-2.5 h-2.5 ${status.dot} rounded-full`} title={status.label}></div>

                                                    {/* Icon and Code */}
                                                    <div className="text-center">
                                                        <Home className={`h-6 w-6 ${color.icon} mx-auto mb-1`} />
                                                        <p className={`font-bold text-sm ${color.text}`}>
                                                            {kandang.kandang_code}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {occupancy}/{kandang.capacity}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Kandang?</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Apakah Anda yakin ingin menghapus kandang <strong>{deleteConfirm.code}</strong>? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Kandang Detail Modal */}
                {selectedKandang && (
                    <KandangDetailModal
                        kandang={selectedKandang}
                        onClose={() => setSelectedKandang(null)}
                    />
                )}
            </div>
        </div>
    )
}

// ======================================================
// KANDANG DETAIL MODAL
// ======================================================

interface KandangAnimal {
    id: string
    code: string
    type: 'livestock' | 'offspring'
    gender: string | null
    breed?: string
}

function KandangDetailModal({ kandang, onClose }: {
    kandang: Kandang
    onClose: () => void
}) {
    const [animals, setAnimals] = useState<KandangAnimal[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnimals()
    }, [kandang.id])

    const fetchAnimals = async () => {
        try {
            setLoading(true)

            // Fetch livestock in this kandang
            const { data: livestockData } = await supabase
                .from('livestock')
                .select('id, id_indukan, gender, settings_breeds(breed_name)')
                .eq('kandang_id', kandang.id)
                .not('status_farm', 'in', '("terjual","mati")')

            // Fetch offspring in this kandang
            const { data: offspringData } = await supabase
                .from('offspring')
                .select('id, id_anakan, gender')
                .eq('kandang_id', kandang.id)
                .not('status_farm', 'in', '("terjual","mati","promosi")')

            const combined: KandangAnimal[] = [
                ...(livestockData || []).map((l: any) => ({
                    id: l.id,
                    code: l.id_indukan,
                    type: 'livestock' as const,
                    gender: l.gender,
                    breed: l.settings_breeds?.breed_name
                })),
                ...(offspringData || []).map((o: any) => ({
                    id: o.id,
                    code: o.id_anakan,
                    type: 'offspring' as const,
                    gender: o.gender
                }))
            ]

            setAnimals(combined)
        } catch (err) {
            console.error('Error fetching animals:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Home className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{kandang.kandang_code}</h2>
                            <p className="text-sm text-white/80">{kandang.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Stats */}
                <div className="px-6 py-3 bg-gray-50 border-b flex justify-between items-center">
                    <div>
                        <span className="text-2xl font-bold text-primary-600">{kandang.current_occupancy || 0}</span>
                        <span className="text-gray-500">/{kandang.capacity}</span>
                        <p className="text-xs text-gray-500">Terisi / Kapasitas</p>
                    </div>
                    {kandang.location && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {kandang.location}
                        </span>
                    )}
                </div>

                {/* Animal List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : animals.length === 0 ? (
                        <div className="text-center py-8">
                            <Rabbit className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Tidak ada ternak terdaftar</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {animals.map((animal) => (
                                <div
                                    key={animal.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${animal.gender === 'jantan' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                                            }`}>
                                            {animal.gender === 'jantan' ? '♂' : '♀'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{animal.code}</p>
                                            <p className="text-xs text-gray-500">
                                                {animal.type === 'livestock' ? 'Indukan' : 'Anakan'}
                                                {animal.breed && ` • ${animal.breed}`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${animal.type === 'livestock'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {animal.type === 'livestock' ? 'Indukan' : 'Anakan'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    )
}
