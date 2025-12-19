import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertCircle } from 'lucide-react'
import { useFinanceCategories } from '@/hooks/useSettings'
import { useIsOnline } from '@/hooks/useOnlineStatus'

interface TransactionFormData {
    transaction_type: 'income' | 'expense'
    category_id: string
    transaction_date: string
    amount: string
    description: string
}

export function FinanceAddForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth()
    const isOnline = useIsOnline()

    // Use offline-aware hook for categories
    const { data: allCategories = [] } = useFinanceCategories()
    // Map to expected format
    const categories = allCategories.map(cat => ({
        ...cat,
        transaction_type: cat.category_type
    }))

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState<TransactionFormData>({
        transaction_type: 'expense',
        category_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
    })

    useEffect(() => {
        // Reset category when type changes
        setFormData((prev) => ({ ...prev, category_id: '' }))
    }, [formData.transaction_type])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const payload = {
                transaction_type: formData.transaction_type,
                category_id: formData.category_id,
                transaction_date: formData.transaction_date,
                amount: parseFloat(formData.amount),
                description: formData.description || null,
                user_id: user?.id,
            }

            // Check if online
            if (!isOnline) {
                const { addToQueue } = await import('@/lib/dexie')
                await addToQueue('financial_transactions', 'insert', payload)

                const { toast } = await import('sonner')
                toast.info('📥 Transaksi disimpan offline', {
                    description: 'Akan sync saat koneksi tersedia'
                })
                onSuccess()
                onClose()
                return
            }

            const { error } = await supabase.from('financial_transactions').insert(payload as any)

            if (error) throw error

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

    const filteredCategories = categories.filter(
        (cat) => cat.transaction_type === formData.transaction_type
    )

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold">Tambah Transaksi</h2>
                        <p className="text-sm text-gray-600 mt-1">Kode transaksi akan di-generate otomatis</p>
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

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipe Transaksi <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, transaction_type: 'income' })}
                                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${formData.transaction_type === 'income'
                                        ? 'border-green-600 bg-green-50 text-green-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                >
                                    💰 Pemasukan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, transaction_type: 'expense' })}
                                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${formData.transaction_type === 'expense'
                                        ? 'border-red-600 bg-red-50 text-red-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                >
                                    💸 Pengeluaran
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kategori <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category_id"
                                required
                                value={formData.category_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Pilih Kategori</option>
                                {filteredCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.category_code} - {cat.category_name}
                                    </option>
                                ))}
                            </select>
                            {filteredCategories.length === 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Belum ada kategori {formData.transaction_type === 'income' ? 'pemasukan' : 'pengeluaran'}.
                                    Tambahkan di menu Settings.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="transaction_date"
                                required
                                value={formData.transaction_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah (Rp) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="amount"
                                required
                                min="0"
                                step="1000"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="150000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                            <textarea
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Catatan transaksi..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Kode Transaksi</strong> akan di-generate otomatis (contoh: TRX-2024-001).
                        </p>
                    </div>

                    {/* Actions */}
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
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
