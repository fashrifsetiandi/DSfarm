import { useState } from 'react'
import { X, TrendingUp, Heart, Info, Plus, Trash2, Baby, ShoppingCart } from 'lucide-react'
import { format } from 'date-fns'
import { useLivestockGrowthLogs, useLivestockHealthRecords } from '@/hooks/useQueries'
import { GrowthChart } from './GrowthChart'
import { GrowthLogForm } from './GrowthLogForm'
import { HealthRecordForm } from './HealthRecordForm'
import { BreedingTab } from './BreedingTab'
import { SellLivestockForm } from './SellLivestockForm'
import { StatusDropdown, maleStatusOptions, femaleStatusOptions, statusFarmOptions } from '../shared/StatusDropdown'
import { supabase } from '@/lib/supabase'

interface Livestock {
    id: string
    user_id: string
    id_indukan: string
    breed_id: string
    gender: 'jantan' | 'betina'
    birth_date: string
    weight_kg?: number
    kandang_id?: string
    acquisition_date?: string
    acquisition_source?: string
    acquisition_price?: number
    mother_id?: string
    father_id?: string
    generation: number
    status: string
    status_farm: string
    health_status: string
    notes?: string
    created_at: string
    updated_at: string
    settings_breeds?: {
        breed_name: string
        breed_code: string
    }
    kandang?: {
        name: string
        kandang_code: string
    }
    mother_livestock?: {
        id_indukan: string
    }
    father_livestock?: {
        id_indukan: string
    }
}

interface LivestockDetailModalProps {
    livestock: Livestock
    onClose: () => void
    onDelete: () => void
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

export function LivestockDetailModal({ livestock, onClose, onDelete }: LivestockDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'growth' | 'health' | 'breeding'>('info')
    const [showGrowthForm, setShowGrowthForm] = useState(false)
    const [showHealthForm, setShowHealthForm] = useState(false)
    const [showSellForm, setShowSellForm] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Use React Query for cached data fetching
    const { data: growthLogs = [], refetch: refetchGrowthLogs } = useLivestockGrowthLogs(livestock.id)
    const { data: healthRecords = [], refetch: refetchHealthRecords } = useLivestockHealthRecords(livestock.id)

    const handleDelete = async () => {
        try {
            const { error } = await supabase
                .from('livestock')
                .delete()
                .eq('id', livestock.id)

            if (error) throw error
            onDelete()
        } catch (err: any) {
            alert('Error: ' + err.message)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount)
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

    // Check if livestock has exited (sold or dead)
    const isExited = ['terjual', 'mati'].includes(livestock.status_farm || '')

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
            {/* Modal - Full screen on mobile, centered on desktop */}
            <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:mx-4 sm:rounded-xl shadow-2xl flex flex-col rounded-t-2xl sm:rounded-xl">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                                    {livestock.id_indukan}
                                </h2>
                                {livestock.notes?.includes('Dipromosikan dari anakan') && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex-shrink-0">
                                        🔗 Breeding
                                    </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{livestock.settings_breeds?.breed_name}</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 ml-2 flex-shrink-0">
                            <button
                                onClick={() => setShowSellForm(true)}
                                className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Jual Indukan"
                            >
                                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus Indukan"
                            >
                                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs - Horizontally scrollable on mobile */}
                <div className="flex-shrink-0 border-b bg-white overflow-x-auto scrollbar-hide">
                    <div className="flex px-2 sm:px-6 min-w-max">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'info'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Info className="h-4 w-4" />
                            <span>Informasi</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('growth')}
                            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'growth'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <TrendingUp className="h-4 w-4" />
                            <span>Pertumbuhan</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('health')}
                            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'health'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Heart className="h-4 w-4" />
                            <span>Kesehatan</span>
                        </button>
                        {livestock.gender === 'betina' && (
                            <button
                                onClick={() => setActiveTab('breeding')}
                                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'breeding'
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Baby className="h-4 w-4" />
                                <span>Breeding</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'info' && (
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Basic Info */}
                            <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                                <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-gray-900">Informasi Dasar</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Tanggal Lahir</label>
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">{format(new Date(livestock.birth_date), 'dd MMM yyyy')}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Umur</label>
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                                            {(() => {
                                                const days = Math.floor((new Date().getTime() - new Date(livestock.birth_date).getTime()) / (1000 * 60 * 60 * 24))
                                                if (days < 30) return `${days} hari`
                                                const months = Math.floor(days / 30)
                                                if (months < 12) return `${months} bulan`
                                                const years = Math.floor(months / 12)
                                                const remainingMonths = months % 12
                                                return remainingMonths > 0 ? `${years} thn ${remainingMonths} bln` : `${years} tahun`
                                            })()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Generasi</label>
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">Gen {livestock.generation}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Berat</label>
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                                            {growthLogs.length > 0
                                                ? `${growthLogs[0].weight_kg} kg`
                                                : livestock.weight_kg
                                                    ? `${livestock.weight_kg} kg`
                                                    : '-'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Kandang</label>
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                                            {livestock.kandang ? `${livestock.kandang.kandang_code}` : 'Tanpa Kandang'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Acquisition Info */}
                            {livestock.acquisition_price && (
                                <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                                    <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-gray-900">Informasi Akuisisi</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Sumber</label>
                                            <p className="text-xs sm:text-sm font-medium text-gray-900">{livestock.acquisition_source || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Harga</label>
                                            <p className="text-xs sm:text-sm font-medium text-gray-900">{formatCurrency(livestock.acquisition_price)}</p>
                                        </div>
                                        {livestock.acquisition_date && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Tanggal</label>
                                                <p className="text-xs sm:text-sm font-medium text-gray-900">{format(new Date(livestock.acquisition_date), 'dd MMM yyyy')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                                <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-gray-900">Status</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Status Kelinci</label>
                                        <StatusDropdown
                                            value={livestock.status}
                                            options={livestock.gender === 'jantan' ? maleStatusOptions : femaleStatusOptions}
                                            onChange={async (value) => {
                                                // @ts-ignore
                                                await supabase.from('livestock').update({ status: value }).eq('id', livestock.id)
                                                onClose()
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Status Farm</label>
                                        <StatusDropdown
                                            value={livestock.status_farm}
                                            options={statusFarmOptions}
                                            onChange={async (value) => {
                                                // @ts-ignore
                                                await supabase.from('livestock').update({ status_farm: value }).eq('id', livestock.id)
                                                onClose()
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Kesehatan</label>
                                        <p className="text-xs sm:text-sm font-medium text-gray-900 capitalize">{livestock.health_status}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {livestock.notes && (
                                <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                                    <h3 className="text-sm sm:text-base font-semibold mb-2 text-gray-900">Catatan</h3>
                                    <p className="text-xs sm:text-sm text-gray-700">{livestock.notes}</p>
                                </div>
                            )}

                            {/* Silsilah - Simple Parent Info */}
                            <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                                <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-gray-900">Silsilah</h3>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">♀ Induk Betina</label>
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                                            {livestock.mother_livestock?.id_indukan || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">♂ Induk Jantan</label>
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                                            {livestock.father_livestock?.id_indukan || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'growth' && (
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Grafik Pertumbuhan</h3>
                                {!isExited && (
                                    <button
                                        onClick={() => setShowGrowthForm(true)}
                                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                    >
                                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">Tambah Data</span>
                                        <span className="sm:hidden">Tambah</span>
                                    </button>
                                )}
                            </div>

                            {growthLogs.length > 0 && (
                                <div className="bg-white border rounded-lg p-3 sm:p-4">
                                    <GrowthChart data={growthLogs} />
                                </div>
                            )}

                            {/* Mobile: Card Layout */}
                            <div className="sm:hidden space-y-2">
                                {growthLogs.length === 0 ? (
                                    <p className="text-center py-6 text-gray-500 text-sm">Belum ada data pertumbuhan</p>
                                ) : (
                                    growthLogs.map((log) => {
                                        const birthDate = new Date(livestock.birth_date)
                                        const measurementDate = new Date(log.measurement_date)
                                        const ageInDays = Math.floor((measurementDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24))
                                        const ageInMonths = Math.floor(ageInDays / 30)
                                        const ageText = ageInMonths > 0 ? `${ageInMonths} bln` : `${ageInDays} hari`

                                        return (
                                            <div key={log.id} className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{format(new Date(log.measurement_date), 'dd MMM yyyy')}</p>
                                                        <p className="text-xs text-gray-500">{ageText}</p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-primary-600">{log.weight_kg} kg</p>
                                                </div>
                                                {log.notes && <p className="text-xs text-gray-600 mt-1">{log.notes}</p>}
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            {/* Desktop: Table Layout */}
                            <div className="hidden sm:block bg-white border rounded-lg overflow-hidden">
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
                                                const birthDate = new Date(livestock.birth_date)
                                                const measurementDate = new Date(log.measurement_date)
                                                const ageInDays = Math.floor((measurementDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24))
                                                const ageInMonths = Math.floor(ageInDays / 30)
                                                const remainingDays = ageInDays % 30
                                                const ageText = ageInMonths > 0 ? `${ageInMonths} bln ${remainingDays} hr` : `${ageInDays} hari`

                                                return (
                                                    <tr key={log.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {format(new Date(log.measurement_date), 'dd MMM yyyy')}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{ageText}</td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.weight_kg} kg</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{log.notes || '-'}</td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {showGrowthForm && (
                                <GrowthLogForm
                                    livestockId={livestock.id}
                                    onClose={() => setShowGrowthForm(false)}
                                    onSuccess={() => {
                                        refetchGrowthLogs()
                                        setShowGrowthForm(false)
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'health' && (
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Riwayat Kesehatan</h3>
                                {!isExited && (
                                    <button
                                        onClick={() => setShowHealthForm(true)}
                                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                    >
                                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">Tambah Catatan</span>
                                        <span className="sm:hidden">Tambah</span>
                                    </button>
                                )}
                            </div>

                            {/* Mobile: Card Layout */}
                            <div className="sm:hidden space-y-2">
                                {healthRecords.length === 0 ? (
                                    <p className="text-center py-6 text-gray-500 text-sm">Belum ada catatan kesehatan</p>
                                ) : (
                                    healthRecords.map((record) => (
                                        <div key={record.id} className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRecordTypeBadge(record.record_type)}`}>
                                                    {record.record_type}
                                                </span>
                                                <span className="text-xs text-gray-500">{format(new Date(record.record_date), 'dd MMM yyyy')}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{record.description}</p>
                                            {record.cost && (
                                                <p className="text-xs text-gray-500 mt-1">Biaya: {formatCurrency(record.cost)}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop: Table Layout */}
                            <div className="hidden sm:block bg-white border rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biaya</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {healthRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
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
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRecordTypeBadge(record.record_type)}`}>
                                                            {record.record_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{record.description}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{record.cost ? formatCurrency(record.cost) : '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {showHealthForm && (
                                <HealthRecordForm
                                    livestockId={livestock.id}
                                    birthDate={livestock.birth_date}
                                    onClose={() => setShowHealthForm(false)}
                                    onSuccess={() => {
                                        refetchHealthRecords()
                                        setShowHealthForm(false)
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'breeding' && livestock.gender === 'betina' && (
                        <BreedingTab
                            livestockId={livestock.id}
                            livestockCode={livestock.id_indukan}
                            birthDate={livestock.birth_date}
                        />
                    )}
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Indukan?</h3>
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
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sell Form Modal */}
            {showSellForm && (
                <SellLivestockForm
                    livestockId={livestock.id}
                    livestockCode={livestock.id_indukan}
                    onClose={() => setShowSellForm(false)}
                    onSuccess={() => {
                        setShowSellForm(false)
                        onClose()
                    }}
                />
            )}
        </div>
    )
}
