import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertCircle } from 'lucide-react'

interface OffspringFormData {
    mother_id: string
    father_id: string
    birth_date: string
    gender: 'jantan' | 'betina' | ''
    weight_kg: string
    kandang_id: string
    health_status: string
    notes: string
}

interface Livestock {
    id: string
    id_indukan: string
    gender: string
}

interface Kandang {
    id: string
    kandang_code: string
    name: string
}

export function OffspringAddForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth()
    const [livestock, setLivestock] = useState<Livestock[]>([])
    const [kandangs, setKandangs] = useState<Kandang[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState<OffspringFormData>({
        mother_id: '',
        father_id: '',
        birth_date: new Date().toISOString().split('T')[0],
        gender: '',
        weight_kg: '',
        kandang_id: '',
        health_status: 'sehat',
        notes: '',
    })

    useEffect(() => {
        fetchLivestock()
        fetchKandangs()
    }, [])

    const fetchLivestock = async () => {
        const { data } = await supabase
            .from('livestock')
            .select('id, id_indukan, gender')
            .eq('status', 'aktif')
            .order('id_indukan')
        setLivestock(data || [])
    }

    const fetchKandangs = async () => {
        const { data } = await supabase.from('kandang').select('*').order('kandang_code')
        setKandangs(data || [])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!formData.mother_id) {
            setError('Induk betina wajib diisi')
            setLoading(false)
            return
        }

        try {
            const weightKg = formData.weight_kg ? parseFloat(formData.weight_kg) : null

            const payload: any = {
                mother_id: formData.mother_id,
                father_id: formData.father_id || null,
                birth_date: formData.birth_date,
                gender: formData.gender || null,
                weight_kg: weightKg,
                kandang_id: formData.kandang_id || null,
                health_status: formData.health_status,
                status_notes: formData.notes || null,
                user_id: user?.id,
            }

            // Insert offspring and get the new ID
            // @ts-ignore - Supabase types limitation
            const { data: insertedData, error: insertError } = await supabase
                .from('offspring')
                .insert(payload)
                .select('id')
                .single()

            if (insertError) throw insertError

            // If weight_kg is provided, also insert to offspring_growth_logs as initial record
            const newId = (insertedData as any)?.id

            if (weightKg && newId) {
                const { error: growthError } = await supabase.from('offspring_growth_logs').insert({
                    offspring_id: newId,
                    measurement_date: formData.birth_date,
                    weight_kg: weightKg,
                    notes: 'Bobot awal saat lahir',
                    user_id: user?.id,
                } as any)
                if (growthError) {
                    console.error('Error inserting growth log:', growthError)
                }
            }

            // Insert initial health record based on health_status
            if (newId) {
                const healthNotes: Record<string, { type: string; desc: string }> = {
                    'sehat': { type: 'checkup', desc: 'Kondisi awal saat lahir - sehat' },
                    'sakit': { type: 'sakit', desc: 'Kondisi awal saat lahir - sakit' },
                    'dalam_perawatan': { type: 'pengobatan', desc: 'Kondisi awal saat lahir - dalam perawatan' },
                }
                const healthStatus = formData.health_status || 'sehat'
                const recordInfo = healthNotes[healthStatus] || { type: 'checkup', desc: `Status awal: ${healthStatus}` }

                const { error: healthError } = await supabase.from('offspring_health_records').insert({
                    offspring_id: newId,
                    record_date: formData.birth_date,
                    record_type: recordInfo.type,
                    description: recordInfo.desc,
                    user_id: user?.id,
                } as any)
                if (healthError) {
                    console.error('Error inserting health record:', healthError)
                }
            }

            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const mothers = livestock.filter((l) => l.gender === 'betina')
    const fathers = livestock.filter((l) => l.gender === 'jantan')

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold">Tambah Anakan Baru</h2>
                        <p className="text-sm text-gray-600 mt-1">ID Anakan akan di-generate otomatis</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Parent Info */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold mb-4 text-primary-600">Informasi Orang Tua</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Induk Betina (Ibu) <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="mother_id"
                                required
                                value={formData.mother_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Pilih Induk Betina</option>
                                {mothers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        ♀ {m.id_indukan}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Induk Jantan (Ayah)
                            </label>
                            <select
                                name="father_id"
                                value={formData.father_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Tidak Diketahui</option>
                                {fathers.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        ♂ {f.id_indukan}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Basic Info */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-semibold mb-4 text-primary-600">Informasi Anakan</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Lahir <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="birth_date"
                                required
                                value={formData.birth_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Belum Diketahui</option>
                                <option value="jantan">Jantan (♂)</option>
                                <option value="betina">Betina (♀)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Berat (kg)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="weight_kg"
                                value={formData.weight_kg}
                                onChange={handleChange}
                                placeholder="0.5"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kandang</label>
                            <select
                                name="kandang_id"
                                value={formData.kandang_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Tanpa Kandang</option>
                                {kandangs.map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.kandang_code} - {k.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status Kesehatan</label>
                            <input
                                type="text"
                                name="health_status"
                                value={formData.health_status}
                                onChange={handleChange}
                                placeholder="Sehat, Sakit, dll"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                            <textarea
                                name="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Catatan tambahan..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>ID Anakan</strong> akan di-generate otomatis dengan format:{' '}
                            <code className="bg-blue-100 px-2 py-0.5 rounded">NZW-M01.F03-251021-01</code>
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                            Format: [Ras]-[Ayah].[Ibu]-[TglLahir]-[Urutan]
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6 pt-6 border-t">
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
                            {loading ? 'Menyimpan...' : 'Simpan Anakan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
