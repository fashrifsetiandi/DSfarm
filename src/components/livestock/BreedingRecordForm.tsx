import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertCircle, Calendar } from 'lucide-react'

interface Birth {
    id: string
    mating_date: string | null
    father_id: string | null
    palpation_date: string | null
    palpation_result: boolean
    male_count: number
    female_count: number
    male_weaned: number
    female_weaned: number
}

interface BreedingRecordFormProps {
    livestockId: string
    motherBirthDate: string  // Birth date of the mother for minimum mating date calculation
    mode?: 'create' | 'edit'
    initialData?: Birth | null
    onClose: () => void
    onSuccess: () => void
}

interface Sire {
    id: string
    id_indukan: string
    settings_breeds?: {
        breed_name: string
        breed_code: string
    }
}

export function BreedingRecordForm({ livestockId, motherBirthDate, mode = 'create', initialData, onClose, onSuccess }: BreedingRecordFormProps) {
    const { user } = useAuth()
    const [sires, setSires] = useState<Sire[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        mating_date: '',
        father_id: '',
        palpation_date: '',
        palpation_result: false,
        male_count: 0,
        female_count: 0,
        male_weaned: 0,
        female_weaned: 0,
    })

    // Fetch available sires (jantan)
    useEffect(() => {
        fetchSires()
    }, [])

    // Pre-populate form when editing
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                mating_date: initialData.mating_date || '',
                father_id: initialData.father_id || '',
                palpation_date: initialData.palpation_date || '',
                palpation_result: initialData.palpation_result || false,
                male_count: initialData.male_count || 0,
                female_count: initialData.female_count || 0,
                male_weaned: initialData.male_weaned || 0,
                female_weaned: initialData.female_weaned || 0,
            })
        }
    }, [mode, initialData])

    const fetchSires = async () => {
        try {
            const { data, error } = await supabase
                .from('livestock')
                .select(`
                    id,
                    id_indukan,
                    settings_breeds (
                        breed_name,
                        breed_code
                    )
                `)
                .eq('gender', 'jantan')
                .eq('status_farm', 'infarm')
                .order('id_indukan')

            if (error) throw error
            setSires((data || []) as unknown as Sire[])
        } catch (err) {
            console.error('Error fetching sires:', err)
        }
    }

    // Auto-calculate birth date (mating_date + 31 days) when palpation is positive
    const calculateBirthDate = () => {
        if (formData.mating_date && formData.palpation_result) {
            const matingDate = new Date(formData.mating_date)
            matingDate.setDate(matingDate.getDate() + 31)
            return matingDate.toISOString().split('T')[0]
        }
        return null
    }

    // Auto-calculate weaning success rate
    const calculateWeaningSuccessRate = () => {
        const totalBorn = formData.male_count + formData.female_count
        const totalWeaned = formData.male_weaned + formData.female_weaned
        if (totalBorn > 0) {
            return ((totalWeaned / totalBorn) * 100).toFixed(2)
        }
        return '0'
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const totalBorn = formData.male_count + formData.female_count
            const totalWeaned = formData.male_weaned + formData.female_weaned
            const birthDate = calculateBirthDate()

            const dataToSave = {
                mother_id: livestockId,
                father_id: formData.father_id || null,
                mating_date: formData.mating_date,
                palpation_date: formData.palpation_date || null,
                palpation_result: formData.palpation_result,
                birth_date: birthDate || formData.mating_date,
                total_born: totalBorn,
                total_alive: totalBorn,
                male_count: formData.male_count,
                female_count: formData.female_count,
                male_weaned: formData.male_weaned,
                female_weaned: formData.female_weaned,
                weaned_count: totalWeaned,
                weaning_success_rate: totalBorn > 0 ? parseFloat(calculateWeaningSuccessRate()) : null,
            }

            let newBirthId: string | undefined

            if (mode === 'edit' && initialData) {
                // Update existing record
                // @ts-ignore - Supabase types limitation
                const { error: updateError } = await supabase
                    .from('births')
                    .update(dataToSave as any)
                    .eq('id', initialData.id)

                if (updateError) throw updateError
                newBirthId = initialData.id
            } else {
                // Insert new record
                // @ts-ignore - Supabase types limitation
                const { data: insertedData, error: insertError } = await supabase
                    .from('births')
                    .insert({
                        user_id: user?.id,
                        ...dataToSave
                    } as any)
                    .select() // Select the inserted data to get the ID

                if (insertError) throw insertError
                newBirthId = (insertedData as any)?.[0]?.id
            }

            // Auto-create offspring if weaning data is complete
            const hasBirth = totalBorn > 0
            const hasWeaningData = (formData.male_weaned > 0 || formData.female_weaned > 0)

            if (hasBirth && hasWeaningData) {
                // Auto-create offspring records for WEANED animals
                const offspringRecords = []
                const weanDate = birthDate || formData.mating_date

                // Create male offspring (weaned)
                for (let i = 0; i < formData.male_weaned; i++) {
                    offspringRecords.push({
                        birth_id: newBirthId,
                        mother_id: livestockId,
                        father_id: formData.father_id || null,
                        birth_date: weanDate,
                        gender: 'jantan',
                        health_status: 'sehat',
                        user_id: user?.id,
                    })
                }

                // Create female offspring (weaned)
                for (let i = 0; i < formData.female_weaned; i++) {
                    offspringRecords.push({
                        birth_id: newBirthId,
                        mother_id: livestockId,
                        father_id: formData.father_id || null,
                        birth_date: weanDate,
                        gender: 'betina',
                        health_status: 'sehat',
                        user_id: user?.id,
                    })
                }

                // Insert offspring and get IDs back
                const { data: insertedOffspring, error: offspringError } = await supabase
                    .from('offspring')
                    .insert(offspringRecords as any)
                    .select('id')

                if (offspringError) {
                    console.error('Error inserting offspring:', offspringError)
                } else if (insertedOffspring && insertedOffspring.length > 0) {
                    // Create health records for each weaned offspring
                    const healthRecords = insertedOffspring.map((offspring: any) => ({
                        offspring_id: offspring.id,
                        record_date: weanDate,
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
                }
            }

            // Always close after save
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const totalBorn = formData.male_count + formData.female_count
    const totalWeaned = formData.male_weaned + formData.female_weaned
    const birthDate = calculateBirthDate()
    const weaningRate = calculateWeaningSuccessRate()

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary-600" />
                            <h2 className="text-xl font-bold text-gray-900">
                                {mode === 'edit' ? 'Edit Catatan Breeding' : 'Tambah Catatan Breeding'}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Mating Information */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Informasi Perkawinan
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Mating Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Kawin *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        min={(() => {
                                            // Minimum mating date is 3 months after mother's birth date
                                            const minDate = new Date(motherBirthDate)
                                            minDate.setMonth(minDate.getMonth() + 3)
                                            return minDate.toISOString().split('T')[0]
                                        })()}
                                        max={new Date().toISOString().split('T')[0]}
                                        value={formData.mating_date}
                                        onChange={(e) => setFormData({ ...formData, mating_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Min: {(() => {
                                            const minDate = new Date(motherBirthDate)
                                            minDate.setMonth(minDate.getMonth() + 3)
                                            return minDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                        })()} (3 bulan setelah lahir)
                                    </p>
                                </div>

                                {/* Sire Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pejantan *
                                    </label>
                                    <select
                                        required
                                        value={formData.father_id}
                                        onChange={(e) => setFormData({ ...formData, father_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="">- Pilih Pejantan -</option>
                                        {sires.map((sire) => (
                                            <option key={sire.id} value={sire.id}>
                                                {sire.id_indukan} - {sire.settings_breeds?.breed_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Palpation Information */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold text-gray-900">Palpasi</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Palpation Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Palpasi
                                    </label>
                                    <input
                                        type="date"
                                        disabled={!formData.mating_date}
                                        min={formData.mating_date ? (() => {
                                            const minDate = new Date(formData.mating_date)
                                            minDate.setDate(minDate.getDate() + 10)
                                            return minDate.toISOString().split('T')[0]
                                        })() : undefined}
                                        max={new Date().toISOString().split('T')[0]}
                                        value={formData.palpation_date}
                                        onChange={(e) => setFormData({ ...formData, palpation_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    {formData.mating_date ? (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Min: {(() => {
                                                const minDate = new Date(formData.mating_date)
                                                minDate.setDate(minDate.getDate() + 10)
                                                return minDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                            })()} (10 hari setelah kawin)
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400 mt-1">Pilih tanggal kawin terlebih dahulu</p>
                                    )}
                                </div>

                                {/* Palpation Result */}
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.palpation_result}
                                            onChange={(e) => setFormData({ ...formData, palpation_result: e.target.checked })}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-700">
                                            Hasil Palpasi Positif (Bunting)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Auto-calculated Birth Date */}
                            {birthDate && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800">
                                        <strong>Perkiraan Tanggal Lahir:</strong> {new Date(birthDate).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                        <span className="text-xs ml-2">(Tanggal kawin + 31 hari)</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Birth Information */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold text-gray-900">Informasi Kelahiran</h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Male Count */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jantan Lahir
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.male_count}
                                        onChange={(e) => setFormData({ ...formData, male_count: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Female Count */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Betina Lahir
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.female_count}
                                        onChange={(e) => setFormData({ ...formData, female_count: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Total Born (Display Only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Total Lahir
                                    </label>
                                    <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-900 font-semibold">
                                        {totalBorn}
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Weaning Information */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold text-gray-900">Informasi Penyapihan</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Male Weaned */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jantan Disapih
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={formData.male_count}
                                        value={formData.male_weaned}
                                        onChange={(e) => setFormData({ ...formData, male_weaned: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Maksimal: {formData.male_count}</p>
                                </div>

                                {/* Female Weaned */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Betina Disapih
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={formData.female_count}
                                        value={formData.female_weaned}
                                        onChange={(e) => setFormData({ ...formData, female_weaned: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Maksimal: {formData.female_count}</p>
                                </div>

                                {/* Weaning Success Rate (Display Only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tingkat Keberhasilan
                                    </label>
                                    <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg">
                                        <span className="text-gray-900 font-semibold">{weaningRate}%</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            ({totalWeaned} dari {totalBorn})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formData.mating_date || !formData.father_id}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {loading
                                    ? (mode === 'edit' ? 'Menyimpan...' : 'Menyimpan...')
                                    : (mode === 'edit' ? 'Update Catatan' : 'Simpan Catatan')
                                }
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
