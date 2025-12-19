import { useState, useMemo } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { useLivestockList } from '@/hooks/useQueries'

interface LivestockSelectorProps {
    title: string
    filterGender?: 'jantan' | 'betina' // Optional: filter by gender
    onClose: () => void
    onSelect: (livestockId: string, idIndukan: string, birthDate: string) => void
}

export function LivestockSelector({ title, filterGender, onClose, onSelect }: LivestockSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('')

    // Use offline-aware hook for livestock data
    const { data: livestockData = [], isLoading: loading } = useLivestockList()

    // Process livestock data with breed info and filter by gender
    const livestock = useMemo(() => {
        let filtered = livestockData.filter((l: any) => l.status_farm === 'infarm')

        if (filterGender) {
            filtered = filtered.filter((l: any) => l.gender === filterGender)
        }

        return filtered.map((l: any) => ({
            id: l.id,
            id_indukan: l.id_indukan,
            gender: l.gender,
            birth_date: l.birth_date,
            settings_breeds: l.settings_breeds
        }))
    }, [livestockData, filterGender])

    const filteredLivestock = livestock.filter((item: any) =>
        item.id_indukan.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b">
                    <input
                        type="text"
                        placeholder="Cari ID indukan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : filteredLivestock.length === 0 ? (
                        <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">Tidak ada kelinci ditemukan</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredLivestock.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item.id, item.id_indukan, item.birth_date)}
                                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900">{item.id_indukan}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.settings_breeds?.breed_name} • {item.gender === 'jantan' ? '♂ Jantan' : '♀ Betina'}
                                            </p>
                                        </div>
                                        <div className="text-primary-600">→</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
