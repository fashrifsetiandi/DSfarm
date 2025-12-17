import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertCircle } from 'lucide-react'
import { useScrollLock } from '@/hooks/useScrollLock'

interface HealthRecordFormProps {
    livestockId: string
    birthDate: string
    onClose: () => void
    onSuccess: () => void
}

export function HealthRecordForm({ livestockId, birthDate, onClose, onSuccess }: HealthRecordFormProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        record_date: new Date().toISOString().split('T')[0],
        record_type: 'checkup',
        description: '',
        treatment: '',
        cost: '',
    })

    // Lock background scroll when modal is open
    useScrollLock(true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error } = await supabase.from('livestock_health_records').insert({
                livestock_id: livestockId,
                record_date: formData.record_date,
                record_type: formData.record_type,
                description: formData.description,
                treatment: formData.treatment || null,
                cost: formData.cost ? parseFloat(formData.cost) : null,
                user_id: user?.id,
            } as any)

            if (error) throw error

            let newHealthStatus = 'sehat'
            if (formData.record_type === 'sakit') {
                newHealthStatus = 'sakit'
            } else if (formData.record_type === 'pengobatan') {
                newHealthStatus = 'dalam_perawatan'
            }

            await supabase
                .from('livestock')
                .update({ health_status: newHealthStatus } as any)
                .eq('id', livestockId)

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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Compact header */}
                <div className="flex justify-between items-center px-4 py-3 border-b sticky top-0 bg-white">
                    <h2 className="text-base font-bold text-gray-900">Catatan Kesehatan</h2>
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
                        {/* Date & Type in row (stack on mobile) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal *</label>
                                <input
                                    type="date"
                                    required
                                    min={birthDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    value={formData.record_date}
                                    onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-white text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Jenis *</label>
                                <select
                                    required
                                    value={formData.record_type}
                                    onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-white text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="checkup">Checkup</option>
                                    <option value="vaksin">Vaksin</option>
                                    <option value="sakit">Sakit</option>
                                    <option value="pengobatan">Pengobatan</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi *</label>
                            <textarea
                                rows={2}
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Kondisi atau tindakan..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Pengobatan</label>
                            <input
                                type="text"
                                value={formData.treatment}
                                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                                placeholder="Obat yang diberikan..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Biaya (Rp)</label>
                            <input
                                type="number"
                                step="1000"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                placeholder="50000"
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

