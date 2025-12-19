import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertCircle } from 'lucide-react'
import { useLivestockList, useKandangList } from '@/hooks/useQueries'
import { useIsOnline } from '@/hooks/useOnlineStatus'

interface BatchOffspring {
    id: string
    gender: 'jantan' | 'betina' | ''
    weight_kg: string
}

interface OffspringBatchAddFormProps {
    birthId?: string // Optional: Link to births table
    motherId?: string // Optional: Pre-fill mother
    fatherId?: string // Optional: Pre-fill father
    birthDate?: string // Optional: Pre-fill birth date
    initialQuantity?: number // Optional: Pre-set quantity
    onClose: () => void
    onSuccess: () => void
}

export function OffspringBatchAddForm({
    birthId,
    motherId: initialMotherId,
    fatherId: initialFatherId,
    birthDate: initialBirthDate,
    initialQuantity,
    onClose,
    onSuccess
}: OffspringBatchAddFormProps) {
    const { user } = useAuth()
    const isOnline = useIsOnline()

    // Use offline-aware hooks for dropdown data
    const { data: livestockData = [] } = useLivestockList()
    const { data: _kandangs = [] } = useKandangList()

    // Extract livestock list
    const livestock = livestockData.map((l: any) => ({
        id: l.id,
        id_indukan: l.id_indukan,
        gender: l.gender
    }))

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Batch form data
    const [motherId, _setMotherId] = useState(initialMotherId || '')
    const [fatherId, _setFatherId] = useState(initialFatherId || '')
    const [birthDate, _setBirthDate] = useState(initialBirthDate || new Date().toISOString().split('T')[0])
    const [kandangId, _setKandangId] = useState('')
    const [_healthStatus, _setHealthStatus] = useState('sehat')
    const [_notes, _setNotes] = useState('')
    const [quantity, _setQuantity] = useState(initialQuantity || 3)

    // Individual offspring data
    const [offspringList, setOffspringList] = useState<BatchOffspring[]>(
        Array.from({ length: initialQuantity || 3 }, (_, i) => ({
            id: String(i + 1),
            gender: '' as const,
            weight_kg: '',
        }))
    )

    // Update list when quantity changes
    useEffect(() => {
        const currentLength = offspringList.length
        if (quantity > currentLength) {
            // Add more
            const newItems = Array.from({ length: quantity - currentLength }, (_, i) => ({
                id: String(currentLength + i + 1),
                gender: '' as const,
                weight_kg: '',
            }))
            setOffspringList([...offspringList, ...newItems])
        } else if (quantity < currentLength) {
            // Remove from end
            setOffspringList(offspringList.slice(0, quantity))
        }
    }, [quantity])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!motherId) {
            setError('Induk betina wajib diisi')
            setLoading(false)
            return
        }

        try {
            // Prepare all offspring records
            const records = offspringList.map((item) => ({
                birth_id: birthId || null, // Link to breeding record if provided
                mother_id: motherId,
                father_id: fatherId || null,
                birth_date: birthDate,
                gender: item.gender || null,
                weight_kg: item.weight_kg ? parseFloat(item.weight_kg) : null,
                kandang_id: kandangId || null,
                health_status: 'sehat',  // Default to sehat
                status_notes: null,
                user_id: user?.id,
            }))

            // Check if online
            if (!isOnline) {
                const { addToQueue } = await import('@/lib/dexie')
                // Queue each offspring separately
                for (const record of records) {
                    await addToQueue('offspring', 'insert', record)
                }

                const { toast } = await import('sonner')
                toast.info('📥 Anakan disimpan offline', {
                    description: `${records.length} anakan akan sync saat koneksi tersedia`
                })
                onSuccess()
                onClose()
                return
            }

            // Insert offspring and get IDs back
            const { data: insertedData, error } = await supabase
                .from('offspring')
                .insert(records as any)
                .select('id, weight_kg')

            if (error) throw error

            // Insert initial health records and growth logs for each offspring
            if (insertedData && insertedData.length > 0) {
                // Insert health records (all start as "sehat" from sapih)
                const healthRecords = insertedData.map((offspring: any) => ({
                    offspring_id: offspring.id,
                    record_date: birthDate,
                    record_type: 'checkup',
                    description: 'Kondisi awal saat sapih - sehat',
                    user_id: user?.id,
                }))

                const { error: healthError } = await supabase
                    .from('offspring_health_records')
                    .insert(healthRecords as any)

                if (healthError) {
                    console.error('Error inserting health records:', healthError)
                }

                // Insert growth logs for those with weight
                const growthLogs = insertedData
                    .filter((o: any) => o.weight_kg)
                    .map((offspring: any) => ({
                        offspring_id: offspring.id,
                        measurement_date: birthDate,
                        weight_kg: offspring.weight_kg,
                        notes: 'Bobot awal saat sapih',
                        user_id: user?.id,
                    }))

                if (growthLogs.length > 0) {
                    const { error: growthError } = await supabase
                        .from('offspring_growth_logs')
                        .insert(growthLogs as any)

                    if (growthError) {
                        console.error('Error inserting growth logs:', growthError)
                    }
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

    const updateOffspring = (id: string, field: keyof BatchOffspring, value: string) => {
        setOffspringList(
            offspringList.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-x-hidden overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold">Tambah Anakan (Batch)</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Tambahkan multiple anakan dari satu kelahiran sekaligus
                        </p>
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

                    {/* Individual Offspring */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-primary-600">Detail Per Anakan (Opsional)</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {offspringList.map((item, index) => (
                                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-900">Anakan #{index + 1}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                                            <select
                                                value={item.gender}
                                                onChange={(e) => updateOffspring(item.id, 'gender', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="">Belum Diketahui</option>
                                                <option value="jantan">Jantan (♂)</option>
                                                <option value="betina">Betina (♀)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Berat (kg)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.weight_kg}
                                                onChange={(e) => updateOffspring(item.id, 'weight_kg', e.target.value)}
                                                placeholder="0.5"
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>ID Anakan</strong> untuk masing-masing anakan akan di-generate otomatis dengan format:{' '}
                            <code className="bg-blue-100 px-2 py-0.5 rounded">NZW-M01.F03-251021-01</code>,{' '}
                            <code className="bg-blue-100 px-2 py-0.5 rounded">NZW-M01.F03-251021-02</code>, dll.
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
                            {loading ? 'Menyimpan...' : `Simpan ${quantity} Anakan`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
