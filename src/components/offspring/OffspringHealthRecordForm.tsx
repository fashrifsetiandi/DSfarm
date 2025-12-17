import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertCircle } from 'lucide-react'

interface OffspringHealthRecordFormProps {
    offspringId: string
    birthDate: string // Offspring birth date to use as minimum date
    onClose: () => void
    onSuccess: () => void
}

export function OffspringHealthRecordForm({ offspringId, birthDate, onClose, onSuccess }: OffspringHealthRecordFormProps) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // @ts-ignore
            const { error } = await supabase.from('offspring_health_records').insert({
                offspring_id: offspringId,
                record_date: formData.record_date,
                record_type: formData.record_type,
                description: formData.description,
                treatment: formData.treatment || null,
                cost: formData.cost ? parseFloat(formData.cost) : null,
                user_id: user?.id,
            })

            if (error) throw error

            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold">Tambah Catatan Kesehatan</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                min={birthDate}
                                max={new Date().toISOString().split('T')[0]}
                                value={formData.record_date}
                                onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Min: {new Date(birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} (tanggal lahir)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jenis Catatan <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.record_type}
                                onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="checkup">Checkup</option>
                                <option value="vaksin">Vaksinasi</option>
                                <option value="sakit">Sakit</option>
                                <option value="pengobatan">Pengobatan</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deskripsi <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Deskripsi kondisi atau tindakan..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pengobatan/Tindakan</label>
                            <textarea
                                rows={2}
                                value={formData.treatment}
                                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                                placeholder="Obat atau tindakan yang diberikan..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Biaya (Rp)</label>
                            <input
                                type="number"
                                step="1000"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                placeholder="50000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
