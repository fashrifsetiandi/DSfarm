import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, Calculator } from 'lucide-react'

interface EquipmentAddFormProps {
    onClose: () => void
    onSuccess: () => void
    editData?: {
        id: string
        equipment_code: string
        equipment_name: string
        purchase_date: string | null
        purchase_price: number | null
        current_value: number | null
        condition: string | null
        notes: string | null
        useful_life_years: number | null
        salvage_value: number | null
        is_manual_value: boolean | null
    }
}

const conditionOptions = [
    { value: 'baru', label: 'Baru' },
    { value: 'baik', label: 'Baik' },
    { value: 'cukup', label: 'Cukup' },
    { value: 'rusak_ringan', label: 'Rusak Ringan' },
    { value: 'rusak_berat', label: 'Rusak Berat' },
]

// Calculate depreciated value using straight-line method
const calculateDepreciatedValue = (
    purchasePrice: number,
    purchaseDate: string,
    usefulLifeYears: number,
    salvageValue: number
): number => {
    const today = new Date()
    const purchase = new Date(purchaseDate)
    const yearsElapsed = (today.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    // Depreciation per year
    const annualDepreciation = (purchasePrice - salvageValue) / usefulLifeYears

    // Current value
    const depreciatedValue = purchasePrice - (annualDepreciation * yearsElapsed)

    // Don't go below salvage value
    return Math.max(depreciatedValue, salvageValue)
}

export function EquipmentAddForm({ onClose, onSuccess, editData }: EquipmentAddFormProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [useAutoCalculate, setUseAutoCalculate] = useState(!editData?.is_manual_value)

    const [formData, setFormData] = useState({
        equipment_name: editData?.equipment_name || '',
        purchase_date: editData?.purchase_date || new Date().toISOString().split('T')[0],
        purchase_price: editData?.purchase_price?.toString() || '',
        current_value: editData?.current_value?.toString() || '',
        condition: editData?.condition || 'baru',
        notes: editData?.notes || '',
        useful_life_years: editData?.useful_life_years?.toString() || '5',
        salvage_value: editData?.salvage_value?.toString() || '0',
    })

    // Auto-generate equipment code for new items
    const [generatedCode] = useState(() => {
        if (editData?.equipment_code) return editData.equipment_code
        const timestamp = Date.now().toString(36).toUpperCase()
        return `EQ-${timestamp}`
    })

    // Auto-calculate current value when relevant fields change
    useEffect(() => {
        if (useAutoCalculate && formData.purchase_price && formData.purchase_date && formData.useful_life_years) {
            const purchasePrice = parseFloat(formData.purchase_price)
            const usefulLife = parseInt(formData.useful_life_years)
            const salvage = parseFloat(formData.salvage_value) || 0

            if (purchasePrice > 0 && usefulLife > 0) {
                const calculated = calculateDepreciatedValue(
                    purchasePrice,
                    formData.purchase_date,
                    usefulLife,
                    salvage
                )
                setFormData(prev => ({ ...prev, current_value: Math.round(calculated).toString() }))
            }
        }
    }, [useAutoCalculate, formData.purchase_price, formData.purchase_date, formData.useful_life_years, formData.salvage_value])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        setError('')

        try {
            const data = {
                user_id: user.id,
                equipment_code: generatedCode,
                equipment_name: formData.equipment_name,
                purchase_date: formData.purchase_date || null,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
                current_value: formData.current_value ? parseFloat(formData.current_value) : null,
                condition: formData.condition,
                notes: formData.notes || null,
                useful_life_years: formData.useful_life_years ? parseInt(formData.useful_life_years) : null,
                salvage_value: formData.salvage_value ? parseFloat(formData.salvage_value) : 0,
                is_manual_value: !useAutoCalculate,
            }

            if (editData) {
                const { error: updateError } = await supabase
                    .from('equipment')
                    .update(data)
                    .eq('id', editData.id)
                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from('equipment')
                    .insert(data)
                if (insertError) throw insertError
            }

            onSuccess()
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: string) => {
        const num = parseFloat(value)
        if (isNaN(num)) return '-'
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-xl flex items-center justify-between sticky top-0">
                    <h2 className="text-lg font-bold text-white">
                        {editData ? 'Edit Peralatan' : 'Tambah Peralatan'}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Peralatan *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.equipment_name}
                            onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                            placeholder="Kandang Besi"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kondisi
                            </label>
                            <select
                                value={formData.condition}
                                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {conditionOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Beli
                            </label>
                            <input
                                type="date"
                                value={formData.purchase_date}
                                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Harga Beli (Rp)
                        </label>
                        <input
                            type="number"
                            value={formData.purchase_price}
                            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                            placeholder="500000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Depreciation Section */}
                    <div className="border-t pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">Depresiasi (Penyusutan)</span>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useAutoCalculate}
                                    onChange={(e) => setUseAutoCalculate(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Hitung Otomatis</span>
                            </label>
                        </div>

                        {useAutoCalculate && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Umur Ekonomis (tahun)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.useful_life_years}
                                        onChange={(e) => setFormData({ ...formData, useful_life_years: e.target.value })}
                                        placeholder="5"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nilai Residu (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.salvage_value}
                                        onChange={(e) => setFormData({ ...formData, salvage_value: e.target.value })}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nilai Saat Ini (Rp)
                                {useAutoCalculate && <span className="text-xs text-blue-600 ml-2">(auto-calculated)</span>}
                            </label>
                            <input
                                type="number"
                                value={formData.current_value}
                                onChange={(e) => {
                                    setFormData({ ...formData, current_value: e.target.value })
                                    if (useAutoCalculate) setUseAutoCalculate(false)
                                }}
                                placeholder="400000"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${useAutoCalculate ? 'bg-blue-50 border-blue-200' : 'border-gray-300'
                                    }`}
                            />
                            {useAutoCalculate && formData.current_value && (
                                <p className="text-xs text-gray-500 mt-1">
                                    = {formatCurrency(formData.current_value)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Catatan tambahan..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : editData ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
