import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Edit2, Trash2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface FinanceCategory {
    id: string
    category_code: string
    category_name: string
    transaction_type: string  // Changed from literal type
    description: string | null
    created_at: string | null  // Allow null
}

export function SettingsFinanceCategoriesPage() {
    const { user } = useAuth()
    const [categories, setCategories] = useState<FinanceCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null)
    const [formData, setFormData] = useState({
        category_code: '',
        category_name: '',
        transaction_type: 'income' as 'income' | 'expense',
        description: '',
    })
    const [error, setError] = useState('')
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')

    useEffect(() => {
        if (user) {
            fetchCategories()
        }
    }, [user])

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('settings_finance_categories')
                .select('*')
                .order('category_name')

            if (error) throw error
            setCategories((data || []) as FinanceCategory[])
        } catch (err) {
            console.error('Error fetching categories:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from('settings_finance_categories')
                    .update({
                        category_code: formData.category_code,
                        category_name: formData.category_name,
                        transaction_type: formData.transaction_type,
                        description: formData.description || null,
                    })
                    .eq('id', editingCategory.id)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('settings_finance_categories')
                    .insert({
                        category_code: formData.category_code,
                        category_name: formData.category_name,
                        transaction_type: formData.transaction_type,
                        description: formData.description || null,
                        user_id: user?.id,
                    } as any)

                if (error) throw error
            }

            await fetchCategories()
            resetForm()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleEdit = (category: FinanceCategory) => {
        setEditingCategory(category)
        setFormData({
            category_code: category.category_code,
            category_name: category.category_name,
            transaction_type: category.transaction_type as 'income' | 'expense',
            description: category.description || '',
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus kategori ini?')) return

        try {
            // Check if category is used in transactions
            const { count } = await supabase
                .from('financial_transactions')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', id)

            if (count && count > 0) {
                alert(`Kategori ini tidak dapat dihapus karena digunakan dalam ${count} transaksi.`)
                return
            }

            const { error } = await supabase
                .from('settings_finance_categories')
                .delete()
                .eq('id', id)

            if (error) throw error
            await fetchCategories()
        } catch (err: any) {
            alert('Error: ' + err.message)
        }
    }

    const resetForm = () => {
        setFormData({
            category_code: '',
            category_name: '',
            transaction_type: 'income',
            description: '',
        })
        setEditingCategory(null)
        setShowForm(false)
        setError('')
    }

    const filteredCategories = categories.filter((cat) =>
        filter === 'all' ? true : cat.transaction_type === filter
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Kategori Keuangan</h1>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">Kelola kategori pemasukan dan pengeluaran</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white text-sm sm:text-base rounded-lg hover:bg-primary-700"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Tambah Kategori</span>
                    <span className="sm:hidden">Tambah</span>
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-2 sm:px-4 py-2 text-sm sm:text-base font-medium whitespace-nowrap ${filter === 'all'
                        ? 'border-b-2 border-primary-600 text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Semua ({categories.length})
                </button>
                <button
                    onClick={() => setFilter('income')}
                    className={`px-2 sm:px-4 py-2 text-sm sm:text-base font-medium whitespace-nowrap ${filter === 'income'
                        ? 'border-b-2 border-green-600 text-green-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <span className="hidden sm:inline">Pemasukan</span>
                    <span className="sm:hidden">Masuk</span> ({categories.filter((c) => c.transaction_type === 'income').length})
                </button>
                <button
                    onClick={() => setFilter('expense')}
                    className={`px-2 sm:px-4 py-2 text-sm sm:text-base font-medium whitespace-nowrap ${filter === 'expense'
                        ? 'border-b-2 border-red-600 text-red-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <span className="hidden sm:inline">Pengeluaran</span>
                    <span className="sm:hidden">Keluar</span> ({categories.filter((c) => c.transaction_type === 'expense').length})
                </button>
            </div>

            {/* Form Dialog */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">
                            {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipe Transaksi *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, transaction_type: 'income' })}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${formData.transaction_type === 'income'
                                            ? 'border-green-600 bg-green-50 text-green-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <TrendingUp className="h-5 w-5" />
                                        Pemasukan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, transaction_type: 'expense' })}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${formData.transaction_type === 'expense'
                                            ? 'border-red-600 bg-red-50 text-red-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <TrendingDown className="h-5 w-5" />
                                        Pengeluaran
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kode Kategori *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={20}
                                    value={formData.category_code}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category_code: e.target.value.toUpperCase() })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="PENJUALAN, PAKAN, SEWA"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Kategori *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={100}
                                    value={formData.category_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category_name: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Penjualan Kelinci"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deskripsi
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Deskripsi kategori..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    {editingCategory ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">Belum ada kategori keuangan</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Tambah kategori pertama
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipe
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kode
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama Kategori
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Deskripsi
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCategories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {category.transaction_type === 'income' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <TrendingUp className="h-3 w-3" />
                                                Pemasukan
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <TrendingDown className="h-3 w-3" />
                                                Pengeluaran
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-mono font-semibold text-primary-600">
                                            {category.category_code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                        {category.category_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {category.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            <Edit2 className="h-4 w-4 inline" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="h-4 w-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
