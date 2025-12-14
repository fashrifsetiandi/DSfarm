import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertCircle } from 'lucide-react'

interface LivestockFormData {
    breed_id: string
    gender: 'jantan' | 'betina'
    birth_date: string
    acquisition_date: string
    purchase_price: string
    weight_kg: string
    status: string
    health_status: string
    kandang_id: string
    notes: string
}

interface Breed {
    id: string
    breed_name: string
    breed_code: string
}

interface Kandang {
    id: string
    kandang_code: string
    name: string
}

export function LivestockAddForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth()
    const [breeds, setBreeds] = useState<Breed[]>([])
    const [kandangs, setKandangs] = useState<Kandang[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState<LivestockFormData>({
        breed_id: '',
        gender: 'jantan',
        birth_date: '',
        acquisition_date: new Date().toISOString().split('T')[0],
        purchase_price: '',
        weight_kg: '',
        status: 'pejantan_aktif',
        health_status: 'sehat',
        kandang_id: '',
        notes: '',
    })

    useEffect(() => {
        fetchBreeds()
        fetchKandangs()
    }, [])

    const fetchBreeds = async () => {
        const { data } = await supabase.from('settings_breeds').select('*').order('breed_name')
        setBreeds(data || [])
    }

    const fetchKandangs = async () => {
        const { data } = await supabase.from('kandang').select('*').order('kandang_code')
        setKandangs(data || [])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const purchasePrice = formData.purchase_price ? parseFloat(formData.purchase_price) : null
            const weightKg = formData.weight_kg ? parseFloat(formData.weight_kg) : null

            const payload: any = {
                breed_id: formData.breed_id,
                gender: formData.gender,
                birth_date: formData.birth_date,
                acquisition_date: formData.acquisition_date || new Date().toISOString().split('T')[0],
                acquisition_source: purchasePrice ? 'purchase' : 'farm_breeding',
                acquisition_price: purchasePrice,
                weight_kg: weightKg,
                status: formData.status,
                status_farm: 'infarm', // Always infarm when adding new livestock
                health_status: formData.health_status,
                kandang_id: formData.kandang_id || null,
                notes: formData.notes || null,
                user_id: user?.id,
            }

            // Insert livestock and get the new ID
            // @ts-ignore - Supabase types limitation
            const { data: insertedData, error: insertError } = await supabase
                .from('livestock')
                .insert(payload)
                .select('id')
                .single()

            if (insertError) throw insertError

            // If weight_kg is provided, also insert to growth_logs as initial record
            const newId = (insertedData as any)?.id
            if (weightKg && newId) {
                await supabase.from('livestock_growth_logs').insert({
                    livestock_id: newId,
                    measurement_date: formData.acquisition_date || new Date().toISOString().split('T')[0],
                    weight_kg: weightKg,
                    notes: 'Bobot awal saat didaftarkan',
                    user_id: user?.id,
                } as any)
            }

            // Also insert initial health record
            if (newId) {
                const healthDescription = formData.health_status === 'sehat'
                    ? 'Kondisi sehat saat didaftarkan'
                    : `Kondisi ${formData.health_status} saat didaftarkan`

                await supabase.from('livestock_health_records').insert({
                    livestock_id: newId,
                    record_date: formData.acquisition_date || new Date().toISOString().split('T')[0],
                    record_type: 'checkup',
                    description: healthDescription,
                    user_id: user?.id,
                } as any)
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

    // Status options based on gender
    const statusOptions = formData.gender === 'jantan'
        ? [
            { value: 'pejantan_aktif', label: 'Pejantan Aktif', color: 'bg-blue-500' },
            { value: 'pejantan_muda', label: 'Pejantan Muda', color: 'bg-blue-400' },
            { value: 'siap_kawin', label: 'Siap Kawin', color: 'bg-purple-500' },
            { value: 'istirahat', label: 'Istirahat', color: 'bg-gray-500' },
            { value: 'siap_jual', label: 'Siap Jual', color: 'bg-orange-500' },
        ]
        : [
            { value: 'betina_muda', label: 'Betina Muda', color: 'bg-pink-400' },
            { value: 'bunting', label: 'Bunting', color: 'bg-pink-600' },
            { value: 'menyusui', label: 'Menyusui', color: 'bg-red-500' },
            { value: 'siap_kawin', label: 'Siap Kawin', color: 'bg-purple-500' },
            { value: 'istirahat', label: 'Istirahat', color: 'bg-gray-500' },
            { value: 'pembesaran', label: 'Pembesaran', color: 'bg-green-500' },
            { value: 'siap_jual', label: 'Siap Jual', color: 'bg-orange-500' },
        ]

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold">Tambah Indukan Baru</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Ras */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ras <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="breed_id"
                                    required
                                    value={formData.breed_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">Pilih Ras</option>
                                    {breeds.map((breed) => (
                                        <option key={breed.id} value={breed.id}>
                                            {breed.breed_code} - {breed.breed_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jenis Kelamin <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="gender"
                                    required
                                    value={formData.gender}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            gender: e.target.value as 'jantan' | 'betina',
                                            status: e.target.value === 'jantan' ? 'pejantan_aktif' : 'betina_muda'
                                        })
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="jantan">Jantan (♂)</option>
                                    <option value="betina">Betina (♀)</option>
                                </select>
                            </div>

                            {/* Birth Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Lahir <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="birth_date"
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                    value={formData.birth_date}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Weight */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Berat (kg)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="weight_kg"
                                    value={formData.weight_kg}
                                    onChange={handleChange}
                                    placeholder="2.5"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Kandang */}
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

                            {/* Purchase Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli (Rp)</label>
                                <input
                                    type="number"
                                    step="1000"
                                    name="purchase_price"
                                    value={formData.purchase_price}
                                    onChange={handleChange}
                                    placeholder="300000"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Tanggal Kedatangan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kedatangan</label>
                                <input
                                    type="date"
                                    name="acquisition_date"
                                    max={new Date().toISOString().split('T')[0]}
                                    value={formData.acquisition_date}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Status (gender-based) */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="status"
                                    required
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    {statusOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Health Status */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status Kesehatan</label>
                                <input
                                    type="text"
                                    name="health_status"
                                    value={formData.health_status}
                                    onChange={handleChange}
                                    placeholder="Sehat"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Notes */}
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
                    </div>

                    {/* Actions - Sticky Footer */}
                    <div className="flex gap-3 p-6 border-t bg-white">
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
                            {loading ? 'Menyimpan...' : 'Simpan Indukan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
