import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertCircle, DollarSign } from 'lucide-react'
import { useScrollLock } from '@/hooks/useScrollLock'

interface SellLivestockFormProps {
    livestockId: string
    livestockCode: string
    onClose: () => void
    onSuccess: () => void
}

export function SellLivestockForm({ livestockId, livestockCode, onClose, onSuccess }: SellLivestockFormProps) {
    const { user } = useAuth()

    // Lock background scroll
    useScrollLock(true)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        sale_date: new Date().toISOString().split('T')[0],
        sale_price: '',
        buyer_name: '',
        notes: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Update livestock status to terjual and clear kandang
            // @ts-ignore
            const { error: updateError } = await supabase
                .from('livestock')
                .update({
                    status_farm: 'terjual',
                    kandang_id: null, // Clear kandang - triggers occupancy decrement
                    notes: `Dijual ke ${formData.buyer_name || 'pembeli'} pada ${formData.sale_date}. ${formData.notes}`.trim()
                })
                .eq('id', livestockId)

            if (updateError) throw updateError

            // Create financial transaction for the sale
            // First, get the PENJUALAN category id
            const { data: categoryData } = await supabase
                .from('settings_finance_categories')
                .select('id')
                .eq('category_code', 'PENJUALAN')
                .single()

            if (categoryData) {
                const transactionCode = `TRX-${formData.sale_date.replace(/-/g, '')}-${Date.now().toString().slice(-6)}`

                // @ts-ignore
                const { error: transactionError } = await supabase
                    .from('financial_transactions')
                    .insert({
                        user_id: user?.id,
                        transaction_code: transactionCode,
                        transaction_type: 'income',
                        category_id: categoryData.id,
                        amount: parseFloat(formData.sale_price),
                        transaction_date: formData.sale_date,
                        description: `Penjualan indukan ${livestockCode} ke ${formData.buyer_name || 'pembeli'}`,
                    } as any)

                if (transactionError) {
                    console.error('Failed to create financial transaction:', transactionError)
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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-3 overflow-hidden" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-x-hidden" onClick={(e) => e.stopPropagation()} style={{ overscrollBehavior: 'contain' }}>
                {/* Compact header - matching GrowthLogForm style */}
                <div className="flex justify-between items-center px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-orange-600" />
                        <h2 className="text-base font-bold text-gray-900">Jual Indukan</h2>
                    </div>
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

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3">
                        <p className="text-xs text-orange-800">
                            <strong>ID Indukan:</strong> {livestockCode}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Tanggal Penjualan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                value={formData.sale_date}
                                onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Harga Jual (Rp) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="1000"
                                required
                                value={formData.sale_price}
                                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                                placeholder="500000"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nama Pembeli</label>
                            <input
                                type="text"
                                value={formData.buyer_name}
                                onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                                placeholder="Nama pembeli (opsional)"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Catatan</label>
                            <textarea
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Catatan tambahan..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                            className="flex-1 px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Jual Indukan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
