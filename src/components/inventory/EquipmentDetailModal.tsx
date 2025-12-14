import { X, Pencil, Trash2, Wrench, Calendar, DollarSign, FileText, TrendingDown, Clock } from 'lucide-react'

interface Equipment {
    id: string
    equipment_code: string
    equipment_name: string
    purchase_date: string | null
    purchase_price: number | null
    current_value: number | null
    condition: string | null
    notes: string | null
    created_at: string
    useful_life_years: number | null
    salvage_value: number | null
    is_manual_value: boolean | null
}

interface EquipmentDetailModalProps {
    equipment: Equipment
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
}

const conditionLabels: Record<string, { label: string; color: string }> = {
    baru: { label: 'Baru', color: 'bg-green-100 text-green-700' },
    baik: { label: 'Baik', color: 'bg-blue-100 text-blue-700' },
    cukup: { label: 'Cukup', color: 'bg-yellow-100 text-yellow-700' },
    rusak_ringan: { label: 'Rusak Ringan', color: 'bg-orange-100 text-orange-700' },
    rusak_berat: { label: 'Rusak Berat', color: 'bg-red-100 text-red-700' },
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

// Calculate depreciation percentage
const calculateDepreciationPercent = (purchasePrice: number, currentValue: number): number => {
    if (!purchasePrice || purchasePrice === 0) return 0
    return ((purchasePrice - currentValue) / purchasePrice) * 100
}

// Calculate years remaining
const calculateYearsRemaining = (purchaseDate: string, usefulLifeYears: number): number => {
    const purchase = new Date(purchaseDate)
    const today = new Date()
    const yearsElapsed = (today.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    return Math.max(0, usefulLifeYears - yearsElapsed)
}

export function EquipmentDetailModal({ equipment, onClose, onEdit, onDelete }: EquipmentDetailModalProps) {
    const condition = conditionLabels[equipment.condition || ''] || { label: equipment.condition, color: 'bg-gray-100 text-gray-700' }

    const depreciationPercent = equipment.purchase_price && equipment.current_value
        ? calculateDepreciationPercent(equipment.purchase_price, equipment.current_value)
        : 0

    const yearsRemaining = equipment.purchase_date && equipment.useful_life_years
        ? calculateYearsRemaining(equipment.purchase_date, equipment.useful_life_years)
        : null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Wrench className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white">{equipment.equipment_name}</h2>
                                <p className="text-sm text-white/80">{equipment.equipment_code}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Condition Badge */}
                    <div className="flex justify-center">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${condition.color}`}>
                            {condition.label}
                        </span>
                    </div>

                    {/* Value Display */}
                    {equipment.current_value && (
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-600 mb-1">Nilai Saat Ini</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(equipment.current_value)}
                            </p>
                            {depreciationPercent > 0 && (
                                <p className="text-sm text-red-500 mt-1 flex items-center justify-center gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    -{depreciationPercent.toFixed(1)}% dari harga beli
                                </p>
                            )}
                            {equipment.is_manual_value && (
                                <p className="text-xs text-gray-400 mt-1">(Nilai manual)</p>
                            )}
                        </div>
                    )}

                    {/* Details */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500">Tanggal Beli</p>
                                <p className="text-sm font-medium">
                                    {equipment.purchase_date
                                        ? new Date(equipment.purchase_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                                        : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500">Harga Beli</p>
                                <p className="text-sm font-medium">
                                    {equipment.purchase_price ? formatCurrency(equipment.purchase_price) : '-'}
                                </p>
                            </div>
                        </div>

                        {equipment.useful_life_years && (
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Umur Ekonomis</p>
                                    <p className="text-sm font-medium">
                                        {equipment.useful_life_years} tahun
                                        {yearsRemaining !== null && (
                                            <span className="text-xs text-gray-500 ml-2">
                                                (sisa {yearsRemaining.toFixed(1)} tahun)
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}

                        {equipment.salvage_value !== null && equipment.salvage_value > 0 && (
                            <div className="flex items-center gap-3">
                                <TrendingDown className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Nilai Residu</p>
                                    <p className="text-sm font-medium">
                                        {formatCurrency(equipment.salvage_value)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {equipment.notes && (
                            <div className="flex items-start gap-3">
                                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Catatan</p>
                                    <p className="text-sm">{equipment.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-gray-400 text-center">
                        Ditambahkan: {new Date(equipment.created_at).toLocaleDateString('id-ID')}
                    </p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t flex gap-3">
                    <button
                        onClick={onDelete}
                        className="flex-1 py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit
                    </button>
                </div>
            </div>
        </div>
    )
}
