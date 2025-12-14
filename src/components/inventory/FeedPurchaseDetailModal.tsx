import { X, Pencil, Trash2, Package, Calendar, DollarSign, User, FileText } from 'lucide-react'

interface FeedPurchase {
    id: string
    purchase_code: string
    feed_type_id: string
    purchase_date: string
    quantity: number
    unit_price: number | null
    total_price: number | null
    supplier: string | null
    notes: string | null
    created_at: string
    settings_feed_types?: {
        feed_name: string
        unit_of_measure: string
    }
}

interface FeedPurchaseDetailModalProps {
    purchase: FeedPurchase
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

export function FeedPurchaseDetailModal({ purchase, onClose, onEdit, onDelete }: FeedPurchaseDetailModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b bg-gradient-to-r from-green-500 to-green-600 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white">
                                    {purchase.settings_feed_types?.feed_name || 'Pakan'}
                                </h2>
                                <p className="text-sm text-white/80">{purchase.purchase_code}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Amount Badge */}
                    <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">
                            {purchase.total_price ? formatCurrency(purchase.total_price) : '-'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {purchase.quantity} {purchase.settings_feed_types?.unit_of_measure || 'unit'}
                            {purchase.unit_price && ` × ${formatCurrency(purchase.unit_price)}`}
                        </p>
                    </div>

                    {/* Details */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500">Tanggal Pembelian</p>
                                <p className="text-sm font-medium">
                                    {new Date(purchase.purchase_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500">Jenis Pakan</p>
                                <p className="text-sm font-medium">
                                    {purchase.settings_feed_types?.feed_name || '-'}
                                </p>
                            </div>
                        </div>

                        {purchase.supplier && (
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Supplier</p>
                                    <p className="text-sm font-medium">{purchase.supplier}</p>
                                </div>
                            </div>
                        )}

                        {purchase.notes && (
                            <div className="flex items-start gap-3">
                                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Catatan</p>
                                    <p className="text-sm">{purchase.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-gray-400 text-center">
                        Ditambahkan: {new Date(purchase.created_at).toLocaleDateString('id-ID')}
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
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit
                    </button>
                </div>
            </div>
        </div>
    )
}
