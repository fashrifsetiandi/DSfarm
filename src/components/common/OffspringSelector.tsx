import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, AlertCircle } from 'lucide-react'

interface OffspringSelectorProps {
    title: string
    onClose: () => void
    onSelect: (offspringId: string, idAnakan: string, birthDate: string) => void
}

interface Offspring {
    id: string
    id_anakan: string
    gender: string | null
    birth_date: string
    status_farm: string
    mother_livestock?: {
        id_indukan: string
    }
}

export function OffspringSelector({ title, onClose, onSelect }: OffspringSelectorProps) {
    const [offspring, setOffspring] = useState<Offspring[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchOffspring()
    }, [])

    const fetchOffspring = async () => {
        try {
            const { data, error } = await supabase
                .from('offspring')
                .select(`
                    id,
                    id_anakan,
                    gender,
                    birth_date,
                    status_farm,
                    mother_livestock:mother_id (
                        id_indukan
                    )
                `)
                .in('status_farm', ['anakan', 'pertumbuhan', 'siap_jual'])
                .order('id_anakan')

            if (error) throw error
            setOffspring((data as unknown as Offspring[]) || [])
        } catch (err) {
            console.error('Error fetching offspring:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredOffspring = offspring.filter(item =>
        item.id_anakan?.toLowerCase().includes(searchTerm.toLowerCase())
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
                        placeholder="Cari ID anakan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : filteredOffspring.length === 0 ? (
                        <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">Tidak ada anakan ditemukan</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredOffspring.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item.id, item.id_anakan, item.birth_date)}
                                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900">{item.id_anakan}</p>
                                            <p className="text-sm text-gray-500">
                                                Induk: {item.mother_livestock?.id_indukan || '-'} • {item.gender === 'jantan' ? '♂ Jantan' : '♀ Betina'}
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
