import { useState, useEffect } from 'react'
import { X, TrendingUp, Heart, Info, Plus, ShoppingCart, ArrowUpCircle, Trash2, Home, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { GrowthChart } from '../livestock/GrowthChart'
import { OffspringGrowthLogForm } from './OffspringGrowthLogForm'
import { OffspringHealthRecordForm } from './OffspringHealthRecordForm'
import { SellOffspringForm } from './SellOffspringForm'
import { PromoteOffspringForm } from './PromoteOffspringForm'
import { KandangPickerModal } from '../shared/KandangPickerModal'

interface Kandang {
    id: string
    kandang_code: string
    name: string
}

interface OffspringDetail {
    id: string
    id_anakan: string
    gender: 'jantan' | 'betina' | null
    birth_date: string
    generation: number
    weight_kg: number | null
    status_farm: string
    health_status: string
    status_notes: string | null
    mother_id: string
    father_id: string | null
    kandang_id: string | null
    created_at: string
    mother_livestock?: { id_indukan: string }
    father_livestock?: { id_indukan: string }
    kandang?: { kandang_code: string; name: string }
}

interface GrowthLog {
    id: string
    measurement_date: string
    weight_kg: number
    notes: string | null
}

interface HealthRecord {
    id: string
    record_date: string
    record_type: string
    description: string
    treatment: string | null
    cost: number | null
}

interface OffspringDetailModalProps {
    offspringId: string
    onClose: () => void
}

export function OffspringDetailModal({ offspringId, onClose }: OffspringDetailModalProps) {
    const [offspring, setOffspring] = useState<OffspringDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'info' | 'growth' | 'health'>('info')
    const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([])
    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
    const [showGrowthForm, setShowGrowthForm] = useState(false)
    const [showHealthForm, setShowHealthForm] = useState(false)
    const [showSellForm, setShowSellForm] = useState(false)
    const [showPromoteForm, setShowPromoteForm] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showKandangPicker, setShowKandangPicker] = useState(false)
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    // Auto-dismiss notification after 3 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [notification])

    useEffect(() => {
        fetchOffspringDetail()
    }, [offspringId])

    useEffect(() => {
        if (activeTab === 'growth' || activeTab === 'info') fetchGrowthLogs()
        if (activeTab === 'health') fetchHealthRecords()
    }, [activeTab, offspringId])

    const fetchOffspringDetail = async () => {
        try {
            const { data, error } = await supabase
                .from('offspring')
                .select(`*, mother_livestock: mother_id(id_indukan), father_livestock: father_id(id_indukan), kandang: kandang_id(kandang_code, name)`)
                .eq('id', offspringId)
                .single()

            if (error) throw error
            setOffspring(data as unknown as OffspringDetail)
        } catch (err) {
            console.error('Error:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchGrowthLogs = async () => {
        const { data } = await supabase
            .from('offspring_growth_logs')
            .select('*')
            .eq('offspring_id', offspringId)
            .order('measurement_date', { ascending: false })
        setGrowthLogs((data as GrowthLog[]) || [])
    }

    const fetchHealthRecords = async () => {
        const { data } = await supabase
            .from('offspring_health_records')
            .select('*')
            .eq('offspring_id', offspringId)
            .order('record_date', { ascending: false })
        setHealthRecords((data as HealthRecord[]) || [])
    }

    const updateKandang = async (newKandangId: string) => {
        try {
            // Single query - database trigger automatically handles occupancy updates
            // @ts-ignore
            const { error } = await supabase
                .from('offspring')
                .update({ kandang_id: newKandangId || null })
                .eq('id', offspringId)

            if (error) throw error

            // Refresh data to get updated kandang info
            await fetchOffspringDetail()
            setNotification({ type: 'success', message: 'Kandang berhasil diperbarui!' })
        } catch (err: any) {
            setNotification({ type: 'error', message: 'Error: ' + err.message })
        }
    }

    const handleDeleteOffspring = async () => {
        try {
            const { error } = await supabase
                .from('offspring')
                .delete()
                .eq('id', offspringId)

            if (error) throw error
            onClose()
        } catch (err) {
            console.error('Error deleting offspring:', err)
            setNotification({ type: 'error', message: 'Gagal menghapus anakan. Silakan coba lagi.' })
        }
    }

    // Get status badge styling and label - consistent with OffspringPage list view
    const getStatusBadge = (status: string): { color: string; label: string } => {
        const statusMap: Record<string, { color: string; label: string }> = {
            anakan: { color: 'bg-yellow-100 text-yellow-700', label: 'Anakan' },
            pertumbuhan: { color: 'bg-blue-100 text-blue-700', label: 'Tumbuh' },
            siap_jual: { color: 'bg-orange-100 text-orange-700', label: 'Siap Jual' },
            terjual: { color: 'bg-green-100 text-green-700', label: 'Terjual' },
            mati: { color: 'bg-gray-200 text-gray-600', label: 'Mati' },
            promosi: { color: 'bg-purple-100 text-purple-700', label: 'Promosi' },
        }
        return statusMap[status] || { color: 'bg-gray-100 text-gray-600', label: status }
    }

    const getRecordTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            checkup: 'bg-blue-100 text-blue-800',
            vaksin: 'bg-green-100 text-green-800',
            sakit: 'bg-red-100 text-red-800',
            pengobatan: 'bg-yellow-100 text-yellow-800',
        }
        return colors[type] || 'bg-gray-100 text-gray-800'
    }

    // Check if offspring has exited (sold, dead, or promoted)
    const isExited = offspring ? ['terjual', 'mati', 'promosi'].includes(offspring.status_farm) : false

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            </div>
        )
    }

    if (!offspring) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 text-center">
                    <p className="text-gray-500 mb-4">Data tidak ditemukan</p>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Tutup</button>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Toast Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${notification.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        {notification.type === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-sm font-medium">{notification.message}</span>
                        <button
                            onClick={() => setNotification(null)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
                {/* Modal - Full screen on mobile, centered on desktop */}
                <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:mx-4 sm:rounded-xl shadow-2xl flex flex-col rounded-t-2xl sm:rounded-xl">
                    {/* Header */}
                    <div className="px-3 xs:px-4 sm:px-6 py-3 sm:py-5 border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base xs:text-lg sm:text-2xl font-bold text-gray-900 truncate">
                                    {offspring.id_anakan}
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                                    {offspring.gender === 'jantan' ? '♂ Jantan' : '♀ Betina'} • Gen {offspring.generation || 1}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 xs:gap-2 ml-2 flex-shrink-0">
                                {/* Action Icons - Only show if not sold/promoted/dead */}
                                {!['terjual', 'promosi', 'mati'].includes(offspring.status_farm) && (
                                    <>
                                        <button
                                            onClick={() => setShowSellForm(true)}
                                            className="p-1.5 xs:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            title="Jual Anakan"
                                        >
                                            <ShoppingCart className="h-4 w-4 xs:h-5 xs:w-5" />
                                        </button>
                                        <button
                                            onClick={() => setShowPromoteForm(true)}
                                            className="p-1.5 xs:p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                            title="Promosi ke Indukan"
                                        >
                                            <ArrowUpCircle className="h-4 w-4 xs:h-5 xs:w-5" />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-1.5 xs:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hapus Anakan"
                                >
                                    <Trash2 className="h-4 w-4 xs:h-5 xs:w-5" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 xs:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5 xs:h-6 xs:w-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs - Horizontally scrollable on mobile */}
                    <div className="flex-shrink-0 border-b bg-white overflow-x-auto scrollbar-hide">
                        <div className="flex px-2 xs:px-4 sm:px-6 min-w-max">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`flex items-center gap-1.5 px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 border-b-2 font-medium text-xs xs:text-sm transition-colors whitespace-nowrap ${activeTab === 'info'
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Info className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                <span>Info</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('growth')}
                                className={`flex items-center gap-1.5 px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 border-b-2 font-medium text-xs xs:text-sm transition-colors whitespace-nowrap ${activeTab === 'growth'
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <TrendingUp className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                <span>Pertumbuhan</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('health')}
                                className={`flex items-center gap-1.5 px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 border-b-2 font-medium text-xs xs:text-sm transition-colors whitespace-nowrap ${activeTab === 'health'
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Heart className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                <span>Kesehatan</span>
                            </button>
                        </div>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Info Tab */}
                        {activeTab === 'info' && (
                            <div className="p-3 xs:p-4 sm:p-6 space-y-3 xs:space-y-4 sm:space-y-6">
                                {/* Basic Info */}
                                <div className="bg-gray-50 rounded-lg p-3 xs:p-4 sm:p-5">
                                    <h3 className="text-xs xs:text-sm sm:text-base font-semibold mb-2 xs:mb-3 sm:mb-4 text-gray-900">Informasi Dasar</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Lahir</label>
                                            <p className="text-sm font-medium text-gray-900">
                                                {format(new Date(offspring.birth_date), 'dd MMM yyyy')}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Umur</label>
                                            <p className="text-sm font-medium text-gray-900">
                                                {(() => {
                                                    const days = Math.floor((new Date().getTime() - new Date(offspring.birth_date).getTime()) / (1000 * 60 * 60 * 24))
                                                    if (days < 7) return `${days} hari`
                                                    if (days < 30) return `${Math.floor(days / 7)} minggu`
                                                    return `${Math.floor(days / 30)} bulan`
                                                })()}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Generasi</label>
                                            <p className="text-sm font-medium text-gray-900">Gen {offspring.generation || 1}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Berat</label>
                                            <p className="text-sm font-medium text-gray-900">
                                                {growthLogs.length > 0
                                                    ? `${growthLogs[0].weight_kg} kg`
                                                    : offspring.weight_kg
                                                        ? `${offspring.weight_kg} kg`
                                                        : '-'
                                                }
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Kandang</label>
                                            {isExited ? (
                                                <div className={`w-full flex items-center px-4 py-2.5 rounded-xl border-2 ${offspring.kandang
                                                    ? 'bg-gray-100 border-gray-200'
                                                    : 'bg-gray-50 border-gray-200'
                                                    }`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-gray-200">
                                                            <Home className="h-4 w-4 text-gray-500" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-medium text-gray-600">
                                                                {offspring.kandang ? offspring.kandang.kandang_code : 'Tidak ada'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowKandangPicker(true)}
                                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all duration-200 ${offspring.kandang
                                                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 border-primary-300 hover:border-primary-400 hover:shadow-md'
                                                        : 'bg-gray-50 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${offspring.kandang ? 'bg-primary-200' : 'bg-gray-200'}`}>
                                                            <Home className={`h-4 w-4 ${offspring.kandang ? 'text-primary-700' : 'text-gray-500'}`} />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className={`text-sm font-medium ${offspring.kandang ? 'text-primary-800' : 'text-gray-500'}`}>
                                                                {offspring.kandang ? offspring.kandang.kandang_code : 'Belum dipilih'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {offspring.kandang ? 'Klik untuk ganti' : 'Klik untuk pilih kandang'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-gray-400">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Silsilah - Simple Parent Info */}
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <h3 className="text-base font-semibold mb-4 text-gray-900">Silsilah</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">♀ Induk Betina</label>
                                            <p className="text-sm font-medium text-gray-900">
                                                {offspring.mother_livestock?.id_indukan || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">♂ Induk Jantan</label>
                                            <p className="text-sm font-medium text-gray-900">
                                                {offspring.father_livestock?.id_indukan || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <h3 className="text-base font-semibold mb-4 text-gray-900">Status</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Status Anakan</label>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(offspring.status_farm).color}`}>
                                                {getStatusBadge(offspring.status_farm).label}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Kesehatan</label>
                                            <p className="text-sm font-medium text-gray-900 capitalize">{offspring.health_status}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {offspring.status_notes && (
                                    <div className="bg-gray-50 rounded-lg p-5">
                                        <h3 className="text-base font-semibold mb-2 text-gray-900">Catatan</h3>
                                        <p className="text-sm text-gray-700">{offspring.status_notes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Growth Tab - Same as Indukan with Chart */}
                        {activeTab === 'growth' && (
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-900">Grafik Pertumbuhan</h3>
                                    {!isExited && (
                                        <button
                                            onClick={() => setShowGrowthForm(true)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Tambah Data
                                        </button>
                                    )}
                                </div>

                                {/* Growth Chart */}
                                {growthLogs.length > 0 && (
                                    <div className="bg-white border rounded-lg p-4">
                                        <GrowthChart data={growthLogs} />
                                    </div>
                                )}

                                {/* Growth Logs Table */}
                                <div className="bg-white border rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Umur</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Berat</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {growthLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                        Belum ada data pertumbuhan
                                                    </td>
                                                </tr>
                                            ) : (
                                                growthLogs.map((log) => {
                                                    // Calculate age at measurement date
                                                    const birthDate = new Date(offspring.birth_date)
                                                    const measurementDate = new Date(log.measurement_date)
                                                    const ageInDays = Math.floor((measurementDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24))
                                                    const ageInMonths = Math.floor(ageInDays / 30)
                                                    const remainingDays = ageInDays % 30
                                                    const ageText = ageInMonths > 0
                                                        ? `${ageInMonths} bln ${remainingDays} hr`
                                                        : `${ageInDays} hari`

                                                    return (
                                                        <tr key={log.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {format(new Date(log.measurement_date), 'dd MMM yyyy')}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {ageText}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                {log.weight_kg} kg
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {log.notes || '-'}
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Health Tab - Same as Indukan */}
                        {activeTab === 'health' && (
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-900">Riwayat Kesehatan</h3>
                                    {!isExited && (
                                        <button
                                            onClick={() => setShowHealthForm(true)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Tambah Catatan
                                        </button>
                                    )}
                                </div>

                                {/* Health Records Table */}
                                <div className="bg-white border rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pengobatan</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biaya</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {healthRecords.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                        Belum ada catatan kesehatan
                                                    </td>
                                                </tr>
                                            ) : (
                                                healthRecords.map((record) => (
                                                    <tr key={record.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {format(new Date(record.record_date), 'dd MMM yyyy')}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRecordTypeBadge(record.record_type)}`}>
                                                                {record.record_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {record.description}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {record.treatment || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {record.cost ? `Rp ${record.cost.toLocaleString()} ` : '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Growth Form Modal */}
            {showGrowthForm && (
                <OffspringGrowthLogForm
                    offspringId={offspringId}
                    birthDate={offspring.birth_date}
                    onClose={() => setShowGrowthForm(false)}
                    onSuccess={() => {
                        fetchGrowthLogs()
                        fetchOffspringDetail()
                    }}
                />
            )}

            {/* Health Form Modal */}
            {showHealthForm && offspring && (
                <OffspringHealthRecordForm
                    offspringId={offspringId}
                    birthDate={offspring.birth_date}
                    onClose={() => setShowHealthForm(false)}
                    onSuccess={fetchHealthRecords}
                />
            )}

            {/* Sell Form Modal */}
            {showSellForm && offspring && (
                <SellOffspringForm
                    offspringId={offspringId}
                    offspringCode={offspring.id_anakan}
                    onClose={() => setShowSellForm(false)}
                    onSuccess={() => {
                        fetchOffspringDetail()
                        onClose()
                    }}
                />
            )}

            {/* Promote Form Modal */}
            {showPromoteForm && offspring && (
                <PromoteOffspringForm
                    offspring={offspring}
                    onClose={() => setShowPromoteForm(false)}
                    onSuccess={() => {
                        fetchOffspringDetail()
                        onClose()
                    }}
                />
            )}

            {/* Kandang Picker Modal */}
            {showKandangPicker && offspring && (
                <KandangPickerModal
                    currentKandangId={offspring.kandang_id}
                    currentKandangCode={offspring.kandang?.kandang_code}
                    onSelect={(kandangId) => updateKandang(kandangId)}
                    onClose={() => setShowKandangPicker(false)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Anakan?</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Tindakan ini tidak dapat dibatalkan. Semua data terkait akan dihapus.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    handleDeleteOffspring()
                                    setShowDeleteConfirm(false)
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
