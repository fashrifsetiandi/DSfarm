import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X } from 'lucide-react'

interface FeedType {
    id: string
    feed_name: string
    unit_of_measure: string
}

interface FeedPurchaseAddFormProps {
    onClose: () => void
    onSuccess: () => void
    editData?: {
        id: string
        purchase_code: string
        feed_type_id: string
        purchase_date: string
        quantity: number
        unit_price: number | null
        total_price: number | null
        supplier: string | null
        notes: string | null
    }
}

export function FeedPurchaseAddForm({ onClose, onSuccess, editData }: FeedPurchaseAddFormProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [feedTypes, setFeedTypes] = useState<FeedType[]>([])

    const [formData, setFormData] = useState({
        purchase_code: editData?.purchase_code || '',
        feed_type_id: editData?.feed_type_id || '',
        purchase_date: editData?.purchase_date || new Date().toISOString().split('T')[0],
        quantity: editData?.quantity?.toString() || '',
        unit_price: editData?.unit_price?.toString() || '',
        supplier: editData?.supplier || '',
        notes: editData?.notes || '',
    })

    // Auto-generate purchase code
    useEffect(() => {
        if (!editData) {
            const timestamp = Date.now().toString(36).toUpperCase()
            setFormData(prev => ({ ...prev, purchase_code: `FP-${timestamp}` }))
        }
    }, [editData])

    // Fetch feed types
    useEffect(() => {
        const fetchFeedTypes = async () => {
            const { data } = await supabase
                .from('settings_feed_types')
                .select('id, feed_name, unit_of_measure')
                .order('feed_name')
            if (data) setFeedTypes(data)
        }
        fetchFeedTypes()
    }, [])

    // Calculate total price
    const totalPrice = parseFloat(formData.quantity || '0') * parseFloat(formData.unit_price || '0')

    const selectedFeedType = feedTypes.find(f => f.id === formData.feed_type_id)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        setError('')

        try {
            const data = {
                user_id: user.id,
                purchase_code: formData.purchase_code,
                feed_type_id: formData.feed_type_id,
                purchase_date: formData.purchase_date,
                quantity: parseFloat(formData.quantity),
                unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
                total_price: totalPrice || null,
                supplier: formData.supplier || null,
                notes: formData.notes || null,
            }

            if (editData) {
                const { error: updateError } = await supabase
                    .from('feed_purchases')
                    .update(data)
                    .eq('id', editData.id)
                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from('feed_purchases')
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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="px-6 py-4 border-b bg-gradient-to-r from-green-500 to-green-600 rounded-t-xl flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                        {editData ? 'Edit Pembelian Pakan' : 'Tambah Pembelian Pakan'}
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kode Pembelian
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.purchase_code}
                                onChange={(e) => setFormData({ ...formData, purchase_code: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-50"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Beli *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.purchase_date}
                                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis Pakan *
                        </label>
                        <select
                            required
                            value={formData.feed_type_id}
                            onChange={(e) => setFormData({ ...formData, feed_type_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Pilih jenis pakan</option>
                            {feedTypes.map((ft) => (
                                <option key={ft.id} value={ft.id}>
                                    {ft.feed_name} ({ft.unit_of_measure})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah * {selectedFeedType && `(${selectedFeedType.unit_of_measure})`}
                            </label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                placeholder="10"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Harga Satuan (Rp)
                            </label>
                            <input
                                type="number"
                                value={formData.unit_price}
                                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                                placeholder="50000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Total Price Display */}
                    {totalPrice > 0 && (
                        <div className="bg-green-50 rounded-lg p-3 flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Harga:</span>
                            <span className="text-lg font-bold text-green-600">
                                Rp {totalPrice.toLocaleString('id-ID')}
                            </span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier
                        </label>
                        <input
                            type="text"
                            value={formData.supplier}
                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            placeholder="Nama supplier"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Catatan tambahan..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                            className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : editData ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
