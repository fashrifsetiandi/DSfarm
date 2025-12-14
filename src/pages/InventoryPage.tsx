import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Wrench, Package, Plus, Wallet, DollarSign, AlertTriangle } from 'lucide-react'
import { EquipmentAddForm } from '@/components/inventory/EquipmentAddForm'
import { EquipmentDetailModal } from '@/components/inventory/EquipmentDetailModal'
import { FeedPurchaseAddForm } from '@/components/inventory/FeedPurchaseAddForm'
import { FeedPurchaseDetailModal } from '@/components/inventory/FeedPurchaseDetailModal'

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

const conditionLabels: Record<string, { label: string; color: string }> = {
    baru: { label: 'Baru', color: 'bg-green-100 text-green-700' },
    baik: { label: 'Baik', color: 'bg-blue-100 text-blue-700' },
    cukup: { label: 'Cukup', color: 'bg-yellow-100 text-yellow-700' },
    rusak_ringan: { label: 'Rusak Ringan', color: 'bg-orange-100 text-orange-700' },
    rusak_berat: { label: 'Rusak Berat', color: 'bg-red-100 text-red-700' },
}

export function InventoryPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'equipment' | 'feed'>('equipment')
    const [equipment, setEquipment] = useState<Equipment[]>([])
    const [feedPurchases, setFeedPurchases] = useState<FeedPurchase[]>([])
    const [loading, setLoading] = useState(true)

    // Form/Modal states
    const [showEquipmentForm, setShowEquipmentForm] = useState(false)
    const [showFeedForm, setShowFeedForm] = useState(false)
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
    const [selectedFeedPurchase, setSelectedFeedPurchase] = useState<FeedPurchase | null>(null)
    const [editEquipment, setEditEquipment] = useState<Equipment | null>(null)
    const [editFeedPurchase, setEditFeedPurchase] = useState<FeedPurchase | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'equipment' | 'feed'; id: string } | null>(null)

    useEffect(() => {
        if (user) fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            const [equipmentRes, feedRes] = await Promise.all([
                supabase.from('equipment').select('*').order('created_at', { ascending: false }),
                supabase
                    .from('feed_purchases')
                    .select(`*, settings_feed_types (feed_name, unit_of_measure)`)
                    .order('purchase_date', { ascending: false }),
            ])

            setEquipment(equipmentRes.data || [])
            setFeedPurchases(feedRes.data || [])
        } catch (err) {
            console.error('Error fetching inventory:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteConfirm) return
        const table = deleteConfirm.type === 'equipment' ? 'equipment' : 'feed_purchases'
        await supabase.from(table).delete().eq('id', deleteConfirm.id)
        setDeleteConfirm(null)
        fetchData()
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    // Calculate stats
    const totalEquipmentValue = equipment.reduce((sum, e) => sum + (e.current_value || e.purchase_price || 0), 0)
    const totalFeedPurchases = feedPurchases.reduce((sum, f) => sum + (f.total_price || 0), 0)

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
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventori</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Wrench className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Peralatan</p>
                                <p className="text-xl font-bold text-gray-900">{equipment.length} item</p>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                            Nilai: <span className="font-semibold">{formatCurrency(totalEquipmentValue)}</span>
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pembelian Pakan</p>
                                <p className="text-xl font-bold text-gray-900">{feedPurchases.length} transaksi</p>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                            Total: <span className="font-semibold">{formatCurrency(totalFeedPurchases)}</span>
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Investasi</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(totalEquipmentValue + totalFeedPurchases)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('equipment')}
                            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'equipment'
                                ? 'border-blue-600 text-blue-600 bg-blue-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Wrench className="h-4 w-4" />
                            Peralatan ({equipment.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'feed'
                                ? 'border-green-600 text-green-600 bg-green-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Package className="h-4 w-4" />
                            Pembelian Pakan ({feedPurchases.length})
                        </button>
                    </div>

                    {/* Add Button */}
                    <div className="p-4 border-b">
                        <button
                            onClick={() => activeTab === 'equipment' ? setShowEquipmentForm(true) : setShowFeedForm(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium ${activeTab === 'equipment' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            <Plus className="h-4 w-4" />
                            {activeTab === 'equipment' ? 'Tambah Peralatan' : 'Tambah Pembelian Pakan'}
                        </button>
                    </div>

                    {/* Equipment Tab Content */}
                    {activeTab === 'equipment' && (
                        <div className="overflow-x-auto">
                            {equipment.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>Belum ada data peralatan</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Beli</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nilai</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Kondisi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {equipment.map((item) => {
                                            const cond = conditionLabels[item.condition || ''] || { label: item.condition, color: 'bg-gray-100 text-gray-700' }
                                            return (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => setSelectedEquipment(item)}
                                                    className="hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{item.equipment_code}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.equipment_name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {item.purchase_date
                                                            ? new Date(item.purchase_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                                            : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                                                        {item.current_value || item.purchase_price ? formatCurrency(item.current_value || item.purchase_price || 0) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${cond.color}`}>
                                                            {cond.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Feed Tab Content */}
                    {activeTab === 'feed' && (
                        <div className="overflow-x-auto">
                            {feedPurchases.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>Belum ada pembelian pakan</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Pakan</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Harga</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {feedPurchases.map((purchase) => (
                                            <tr
                                                key={purchase.id}
                                                onClick={() => setSelectedFeedPurchase(purchase)}
                                                className="hover:bg-gray-50 cursor-pointer"
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {new Date(purchase.purchase_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {purchase.settings_feed_types?.feed_name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right text-gray-900">
                                                    {purchase.quantity} {purchase.settings_feed_types?.unit_of_measure || ''}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                                                    {purchase.total_price ? formatCurrency(purchase.total_price) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {purchase.supplier || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Equipment Add Form */}
            {showEquipmentForm && (
                <EquipmentAddForm
                    onClose={() => setShowEquipmentForm(false)}
                    onSuccess={() => {
                        setShowEquipmentForm(false)
                        fetchData()
                    }}
                />
            )}

            {/* Equipment Edit Form */}
            {editEquipment && (
                <EquipmentAddForm
                    editData={editEquipment}
                    onClose={() => setEditEquipment(null)}
                    onSuccess={() => {
                        setEditEquipment(null)
                        fetchData()
                    }}
                />
            )}

            {/* Equipment Detail Modal */}
            {selectedEquipment && (
                <EquipmentDetailModal
                    equipment={selectedEquipment}
                    onClose={() => setSelectedEquipment(null)}
                    onEdit={() => {
                        setEditEquipment(selectedEquipment)
                        setSelectedEquipment(null)
                    }}
                    onDelete={() => {
                        setDeleteConfirm({ type: 'equipment', id: selectedEquipment.id })
                        setSelectedEquipment(null)
                    }}
                />
            )}

            {/* Feed Add Form */}
            {showFeedForm && (
                <FeedPurchaseAddForm
                    onClose={() => setShowFeedForm(false)}
                    onSuccess={() => {
                        setShowFeedForm(false)
                        fetchData()
                    }}
                />
            )}

            {/* Feed Edit Form */}
            {editFeedPurchase && (
                <FeedPurchaseAddForm
                    editData={editFeedPurchase}
                    onClose={() => setEditFeedPurchase(null)}
                    onSuccess={() => {
                        setEditFeedPurchase(null)
                        fetchData()
                    }}
                />
            )}

            {/* Feed Detail Modal */}
            {selectedFeedPurchase && (
                <FeedPurchaseDetailModal
                    purchase={selectedFeedPurchase}
                    onClose={() => setSelectedFeedPurchase(null)}
                    onEdit={() => {
                        setEditFeedPurchase(selectedFeedPurchase)
                        setSelectedFeedPurchase(null)
                    }}
                    onDelete={() => {
                        setDeleteConfirm({ type: 'feed', id: selectedFeedPurchase.id })
                        setSelectedFeedPurchase(null)
                    }}
                />
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
