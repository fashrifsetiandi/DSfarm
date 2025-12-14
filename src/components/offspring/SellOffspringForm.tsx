import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertCircle, DollarSign } from 'lucide-react'

interface SellOffspringFormProps {
    offspringId: string
    offspringCode: string
    onClose: () => void
    onSuccess: () => void
}

export function SellOffspringForm({ offspringId, offspringCode, onClose, onSuccess }: SellOffspringFormProps) {
    const { user } = useAuth()
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
            // Update offspring status to terjual and clear kandang
            // @ts-ignore
            const { error: updateError } = await supabase
                .from('offspring')
                .update({
                    status_farm: 'terjual',
                    kandang_id: null, // Clear kandang - triggers occupancy decrement
                    status_notes: `Dijual ke ${formData.buyer_name || 'pembeli'} pada ${formData.sale_date}. ${formData.notes}`.trim()
                })
                .eq('id', offspringId)

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
                        description: `Penjualan anakan ${offspringCode} ke ${formData.buyer_name || 'pembeli'}`,
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-orange-500 to-orange-600">
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-6 w-6 text-white" />
                        <h2 className="text-xl font-bold text-white">Jual Anakan</h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
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

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-orange-800">
                            <strong>Kode Anakan:</strong> {offspringCode}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Penjualan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                value={formData.sale_date}
                                onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Harga Jual (Rp) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="1000"
                                required
                                value={formData.sale_price}
                                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                                placeholder="150000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pembeli</label>
                            <input
                                type="text"
                                value={formData.buyer_name}
                                onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                                placeholder="Nama pembeli (opsional)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                            <textarea
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Catatan tambahan..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Jual Anakan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
