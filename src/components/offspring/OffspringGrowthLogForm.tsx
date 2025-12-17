import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertCircle } from 'lucide-react'
import { useScrollLock } from '@/hooks/useScrollLock'

interface OffspringGrowthLogFormProps {
    offspringId: string
    birthDate: string
    onClose: () => void
    onSuccess: () => void
}

export function OffspringGrowthLogForm({ offspringId, birthDate, onClose, onSuccess }: OffspringGrowthLogFormProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        measurement_date: new Date().toISOString().split('T')[0],
        weight_kg: '',
        notes: '',
    })

    // Lock background scroll when modal is open
    useScrollLock(true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error } = await supabase.from('offspring_growth_logs').insert({
                offspring_id: offspringId,
                measurement_date: formData.measurement_date,
                weight_kg: parseFloat(formData.weight_kg),
                notes: formData.notes || null,
                user_id: user?.id,
            } as any)

            if (error) throw error

            await supabase
                .from('offspring')
                .update({ weight_kg: parseFloat(formData.weight_kg) } as any)
                .eq('id', offspringId)

            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-3" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                {/* Compact header */}
                <div className="flex justify-between items-center px-4 py-3 border-b">
                    <h2 className="text-base font-bold text-gray-900">Tambah Data Bobot</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    {error && (
                        <div className="mb-3 bg-red-50 border border-red-200 text-red-800 rounded-lg p-2 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <p className="text-xs">{error}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Tanggal <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                min={birthDate}
                                max={new Date().toISOString().split('T')[0]}
                                value={formData.measurement_date}
                                onChange={(e) => setFormData({ ...formData, measurement_date: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Berat (kg) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.weight_kg}
                                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                                placeholder="0.5"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Catatan</label>
                            <textarea
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Catatan tambahan..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

