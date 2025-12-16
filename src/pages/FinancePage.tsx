/**
 * ======================================================
 * FINANCE PAGE - Halaman Keuangan
 * ======================================================
 * 
 * PENJELASAN STRUKTUR KODE:
 * 
 * 1. IMPORTS - Mengimpor library dan komponen yang dibutuhkan
 * 2. INTERFACES - Mendefinisikan tipe data (TypeScript)
 * 3. HELPER FUNCTIONS - Fungsi utilitas (format currency, filter tanggal)
 * 4. COMPONENT - Komponen utama halaman
 *    - State (data yang bisa berubah)
 *    - Effects (aksi saat komponen dimuat)
 *    - Computed Values (data yang dihitung dari state)
 *    - Event Handlers (fungsi saat user klik)
 *    - Render (tampilan UI)
 * 
 * ======================================================
 */

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, Pencil, Trash2, Calendar, Eye, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, isWithinInterval } from 'date-fns'
import { FinanceForm } from '@/components/finance/FinanceForm'

// ======================================================
// INTERFACES - Tipe Data
// ======================================================

/** Struktur data transaksi keuangan */
interface Transaction {
    id: string
    transaction_code: string
    transaction_type: 'income' | 'expense'
    category_id: string
    transaction_date: string
    amount: number
    description: string | null
    created_at: string
    settings_finance_categories?: {
        category_name: string
        category_code: string
    }
}

/** Opsi filter periode */
type PeriodFilter = 'all' | 'this_month' | 'last_month' | 'this_year'

// ======================================================
// HELPER FUNCTIONS - Fungsi Utilitas
// ======================================================

/** Format angka menjadi mata uang Rupiah */
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

/** Check if transaction is new (created within 1 minute) */
const isNew = (createdAt: string): boolean => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    return diffMs < 60000 // 1 minute in ms
}

/** Filter transaksi berdasarkan periode */
const filterByPeriod = (transactions: Transaction[], period: PeriodFilter): Transaction[] => {
    if (period === 'all') return transactions

    const now = new Date()
    let start: Date, end: Date

    switch (period) {
        case 'this_month':
            start = startOfMonth(now)
            end = endOfMonth(now)
            break
        case 'last_month':
            const lastMonth = subMonths(now, 1)
            start = startOfMonth(lastMonth)
            end = endOfMonth(lastMonth)
            break
        case 'this_year':
            start = startOfYear(now)
            end = now
            break
        default:
            return transactions
    }

    return transactions.filter(t => {
        const date = new Date(t.transaction_date)
        return isWithinInterval(date, { start, end })
    })
}

/** Hitung breakdown per kategori */
const calculateCategoryBreakdown = (transactions: Transaction[], type: 'income' | 'expense' | 'all') => {
    // If 'all', default to expense for backward compatibility
    const targetType = type === 'all' ? 'expense' : type
    const filtered = transactions.filter(t => t.transaction_type === targetType)
    const total = filtered.reduce((sum, t) => sum + t.amount, 0)

    // Group by category
    const byCategory: Record<string, { name: string; amount: number; percentage: number }> = {}

    filtered.forEach(t => {
        const catName = t.settings_finance_categories?.category_name || 'Lainnya'
        if (!byCategory[catName]) {
            byCategory[catName] = { name: catName, amount: 0, percentage: 0 }
        }
        byCategory[catName].amount += t.amount
    })

    // Calculate percentages
    Object.values(byCategory).forEach(cat => {
        cat.percentage = total > 0 ? (cat.amount / total) * 100 : 0
    })

    // Sort by amount descending
    return Object.values(byCategory).sort((a, b) => b.amount - a.amount)
}

// ======================================================
// PERIOD OPTIONS - Opsi Filter Periode
// ======================================================
const periodOptions: { value: PeriodFilter; label: string }[] = [
    { value: 'all', label: 'Semua Waktu' },
    { value: 'this_month', label: 'Bulan Ini' },
    { value: 'last_month', label: 'Bulan Lalu' },
    { value: 'this_year', label: 'Tahun Ini' },
]

// ======================================================
// COMPONENT - Halaman Keuangan
// ======================================================
export function FinancePage() {
    const { user } = useAuth()

    // -------------------- STATE --------------------
    // State = data yang bisa berubah dan akan me-render ulang UI

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
    const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('this_month')

    // Form state
    const [showForm, setShowForm] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null)
    const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null)

    // -------------------- EFFECTS --------------------
    // useEffect = aksi yang dijalankan saat komponen dimuat atau state berubah

    useEffect(() => {
        if (user) fetchTransactions()
    }, [user])

    // -------------------- DATA FETCHING --------------------

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('financial_transactions')
                .select(`*, settings_finance_categories (category_name, category_code)`)
                .order('created_at', { ascending: false }) // Sort by created_at for newest first

            if (error) throw error
            setTransactions((data || []) as Transaction[])
        } catch (err) {
            console.error('Error fetching transactions:', err)
        } finally {
            setLoading(false)
        }
    }

    // -------------------- COMPUTED VALUES --------------------
    // useMemo = nilai yang dihitung dari state, di-cache agar tidak dihitung ulang terus

    // Filter transactions berdasarkan periode, tipe, dan pencarian
    const filteredTransactions = useMemo(() => {
        let result = filterByPeriod(transactions, filterPeriod)

        // Filter by type
        if (filterType !== 'all') {
            result = result.filter(t => t.transaction_type === filterType)
        }

        // Filter by search
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            result = result.filter(t =>
                t.transaction_code.toLowerCase().includes(search) ||
                t.settings_finance_categories?.category_name.toLowerCase().includes(search) ||
                t.description?.toLowerCase().includes(search)
            )
        }

        return result
    }, [transactions, filterPeriod, filterType, searchTerm])

    // Statistik
    const stats = useMemo(() => {
        const periodTransactions = filterByPeriod(transactions, filterPeriod)
        const income = periodTransactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + t.amount, 0)
        const expense = periodTransactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + t.amount, 0)
        return { income, expense, balance: income - expense, count: periodTransactions.length }
    }, [transactions, filterPeriod])

    // Category breakdowns - separate for income and expense
    const incomeBreakdown = useMemo(() => {
        return calculateCategoryBreakdown(filterByPeriod(transactions, filterPeriod), 'income')
    }, [transactions, filterPeriod])

    const expenseBreakdown = useMemo(() => {
        return calculateCategoryBreakdown(filterByPeriod(transactions, filterPeriod), 'expense')
    }, [transactions, filterPeriod])

    // -------------------- EVENT HANDLERS --------------------

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction)
        setShowForm(true)
    }

    const handleDelete = async () => {
        if (!deleteConfirm) return
        try {
            await supabase.from('financial_transactions').delete().eq('id', deleteConfirm.id)
            await fetchTransactions()
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setDeleteConfirm(null)
        }
    }

    const handleFormClose = () => {
        setShowForm(false)
        setEditingTransaction(null)
    }

    const handleFormSuccess = () => {
        fetchTransactions()
        handleFormClose()
    }

    // -------------------- RENDER --------------------

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Keuangan</h1>
                        <p className="text-gray-600 text-sm mt-1">Kelola transaksi pemasukan dan pengeluaran</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white text-sm sm:text-base rounded-lg hover:bg-primary-700"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Tambah Transaksi</span>
                        <span className="sm:hidden">Tambah</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
                    <StatCard
                        icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />}
                        label="Saldo"
                        value={formatCurrency(stats.balance)}
                        valueColor={stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}
                    />
                    <StatCard
                        icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />}
                        label="Pemasukan"
                        value={formatCurrency(stats.income)}
                        valueColor="text-green-600"
                    />
                    <StatCard
                        icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />}
                        label="Pengeluaran"
                        value={formatCurrency(stats.expense)}
                        valueColor="text-red-600"
                    />
                    <StatCard
                        icon={<Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />}
                        label="Transaksi"
                        value={stats.count.toString()}
                        valueColor="text-gray-900"
                    />
                </div>

                {/* Category Breakdowns - show based on filter type */}
                {(filterType === 'all' || filterType === 'income') && incomeBreakdown.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">
                            Breakdown Pemasukan
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({periodOptions.find(p => p.value === filterPeriod)?.label})
                            </span>
                        </h3>
                        <div className="space-y-2">
                            {incomeBreakdown.slice(0, 5).map(cat => (
                                <div key={cat.name} className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-700">{cat.name}</span>
                                            <span className="text-gray-500">{cat.percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-green-500"
                                                style={{ width: `${cat.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 w-28 text-right">
                                        {formatCurrency(cat.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(filterType === 'all' || filterType === 'expense') && expenseBreakdown.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">
                            Breakdown Pengeluaran
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({periodOptions.find(p => p.value === filterPeriod)?.label})
                            </span>
                        </h3>
                        <div className="space-y-2">
                            {expenseBreakdown.slice(0, 5).map(cat => (
                                <div key={cat.name} className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-700">{cat.name}</span>
                                            <span className="text-gray-500">{cat.percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-red-500"
                                                style={{ width: `${cat.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 w-28 text-right">
                                        {formatCurrency(cat.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                        {/* Search */}
                        <div className="col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        {/* Period Filter */}
                        <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value as PeriodFilter)}
                            className="px-2 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            {periodOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {/* Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="px-2 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">Semua</option>
                            <option value="income">Masuk</option>
                            <option value="expense">Keluar</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {filteredTransactions.length === 0 ? (
                        <EmptyState
                            hasFilters={!!searchTerm || filterType !== 'all' || filterPeriod !== 'all'}
                            onAddClick={() => setShowForm(true)}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Deskripsi</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredTransactions.map((t) => (
                                        <tr
                                            key={t.id}
                                            onClick={() => setDetailTransaction(t)}
                                            className="hover:bg-gray-50 cursor-pointer"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <span>{format(new Date(t.transaction_date), 'dd MMM yyyy')}</span>
                                                    {isNew(t.created_at) && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-500 text-white">
                                                            NEW
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {t.settings_finance_categories?.category_name}
                                                </div>
                                                <TypeBadge type={t.transaction_type} />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate hidden md:table-cell">
                                                {t.description || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`text-sm font-semibold ${t.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {t.transaction_type === 'income' ? '+' : '-'}
                                                    {formatCurrency(t.amount).replace('Rp', '').trim()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <FinanceForm
                    transaction={editingTransaction}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <DeleteConfirmModal
                    code={deleteConfirm.transaction_code}
                    onCancel={() => setDeleteConfirm(null)}
                    onConfirm={handleDelete}
                />
            )}

            {/* Transaction Detail Modal */}
            {detailTransaction && (
                <TransactionDetailModal
                    transaction={detailTransaction}
                    onClose={() => setDetailTransaction(null)}
                    onEdit={() => {
                        handleEdit(detailTransaction)
                        setDetailTransaction(null)
                    }}
                    onDelete={() => {
                        setDeleteConfirm(detailTransaction)
                        setDetailTransaction(null)
                    }}
                />
            )}
        </div>
    )
}

// ======================================================
// SUB-COMPONENTS - Komponen Kecil yang Digunakan di Atas
// ======================================================

/** Card untuk menampilkan statistik */
function StatCard({ icon, label, value, valueColor }: {
    icon: React.ReactNode
    label: string
    value: string
    valueColor: string
}) {
    return (
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                {icon}
                <p className="text-xs sm:text-sm text-gray-600">{label}</p>
            </div>
            <p className={`text-base sm:text-xl md:text-2xl font-bold ${valueColor} truncate`}>{value}</p>
        </div>
    )
}

/** Badge untuk tipe transaksi */
function TypeBadge({ type }: { type: 'income' | 'expense' }) {
    return type === 'income' ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <TrendingUp className="h-3 w-3" /> Masuk
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <TrendingDown className="h-3 w-3" /> Keluar
        </span>
    )
}

/** Tampilan saat tidak ada data */
function EmptyState({ hasFilters, onAddClick }: { hasFilters: boolean; onAddClick: () => void }) {
    return (
        <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
                {hasFilters ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi keuangan'}
            </p>
            {!hasFilters && (
                <button onClick={onAddClick} className="text-primary-600 hover:text-primary-700 font-medium">
                    Tambah transaksi pertama
                </button>
            )}
        </div>
    )
}

/** Modal konfirmasi hapus */
function DeleteConfirmModal({ code, onCancel, onConfirm }: {
    code: string
    onCancel: () => void
    onConfirm: () => void
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Transaksi?</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Yakin ingin menghapus transaksi <strong>{code}</strong>?
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    )
}

/** Modal untuk menampilkan detail transaksi */
function TransactionDetailModal({ transaction, onClose, onEdit, onDelete }: {
    transaction: Transaction
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={`px-6 py-4 border-b flex items-center justify-between ${transaction.transaction_type === 'income'
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}>
                    <div>
                        <h2 className="text-lg font-bold text-white">Detail Transaksi</h2>
                        <p className="text-sm text-white/80">{transaction.transaction_code}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Amount - Large display */}
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">
                            {transaction.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </p>
                        <p className={`text-3xl font-bold ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {transaction.transaction_type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                        </p>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-3">
                        <DetailRow
                            label="Kode Transaksi"
                            value={transaction.transaction_code}
                        />
                        <DetailRow
                            label="Tanggal"
                            value={format(new Date(transaction.transaction_date), 'dd MMMM yyyy')}
                        />
                        <DetailRow
                            label="Kategori"
                            value={transaction.settings_finance_categories?.category_name || '-'}
                        />
                        <DetailRow
                            label="Tipe"
                            value={transaction.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        />
                        <DetailRow
                            label="Deskripsi"
                            value={transaction.description || '-'}
                        />
                        <DetailRow
                            label="Dibuat"
                            value={format(new Date(transaction.created_at), 'dd MMM yyyy, HH:mm')}
                        />
                    </div>
                </div>

                {/* Footer with Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t rounded-b-xl flex gap-3">
                    <button
                        onClick={onEdit}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    )
}

/** Helper component for detail rows */
function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
        </div>
    )
}
