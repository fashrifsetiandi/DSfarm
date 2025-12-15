import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, DollarSign } from 'lucide-react'
import { LivestockAddForm } from '@/components/livestock/LivestockAddForm'
import { LivestockDetailModal } from '@/components/livestock/LivestockDetailModal'
import { StatusDropdown, statusFarmOptions, maleStatusOptions, femaleStatusOptions } from '@/components/shared/StatusDropdown'
import { BatchSellForm } from '@/components/shared/BatchSellForm'
import { calculateAge } from '@/utils/dateUtils'
import { useLivestockList, useInvalidateLivestock } from '@/hooks/useQueries'

interface Livestock {
    id: string
    user_id: string
    id_indukan: string
    breed_id: string
    gender: 'jantan' | 'betina'
    birth_date: string
    status: string
    status_farm: string
    health_status: string
    generation: number
    weight_kg?: number
    latest_weight?: number  // From growth_logs
    acquisition_price?: number
    acquisition_source?: string
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

export function LivestockPage() {
    const { data: livestock = [], isLoading: loading, refetch } = useLivestockList()
    const invalidateLivestock = useInvalidateLivestock()
    const [showAddForm, setShowAddForm] = useState(false)
    const [showBatchSell, setShowBatchSell] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedGenders] = useState<string[]>([])
    const [selectedStatuses] = useState<string[]>([])
    const [selectedLivestock, setSelectedLivestock] = useState<Livestock | null>(null)
    // Tab and sub-filter state for stats cards
    const [activeTab, setActiveTab] = useState<'infarm' | 'keluar' | 'all'>('infarm')
    const [filterSubStatus, setFilterSubStatus] = useState<string | null>(null)

    const filteredLivestock = livestock.filter((item) => {
        const matchesSearch =
            item.id_indukan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.settings_breeds?.breed_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesGender = selectedGenders.length === 0 || selectedGenders.includes(item.gender)
        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status)

        // Tab-based filtering
        let matchesTab = true
        if (activeTab === 'infarm') {
            matchesTab = item.status_farm === 'infarm'
            // Sub-filter for gender within infarm
            if (filterSubStatus === 'jantan') matchesTab = matchesTab && item.gender === 'jantan'
            if (filterSubStatus === 'betina') matchesTab = matchesTab && item.gender === 'betina'
        } else if (activeTab === 'keluar') {
            matchesTab = item.status_farm !== 'infarm'
            // Sub-filter for status within keluar
            if (filterSubStatus === 'terjual') matchesTab = item.status_farm === 'terjual'
            if (filterSubStatus === 'mati') matchesTab = item.status_farm === 'mati'
        }
        // activeTab === 'all' shows everything

        return matchesSearch && matchesGender && matchesStatus && matchesTab
    })



    const updateStatus = async (id: string, field: 'status' | 'status_farm', value: string) => {
        // Update with explicit field approach to handle TypeScript strict mode
        // @ts-ignore - Supabase types limitation for RLS-protected tables
        if (field === 'status') {
            // @ts-ignore
            await supabase.from('livestock').update({ status: value }).eq('id', id)
        } else {
            // @ts-ignore
            await supabase.from('livestock').update({ status_farm: value }).eq('id', id)
        }

        // Refetch to update the cache
        refetch()
    }

    const isNew = (createdAt: string) => {
        const minutesSince = Math.floor(
            (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60)
        )
        return minutesSince <= 1  // Only show "BARU" for 1 minute
    }

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
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Indukan</h1>
                        <p className="text-gray-600 text-sm mt-1">Kelola data kelinci indukan</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowBatchSell(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-orange-600 text-white text-sm sm:text-base rounded-lg hover:bg-orange-700"
                        >
                            <DollarSign className="h-4 w-4" />
                            <span className="hidden sm:inline">Jual Batch</span>
                            <span className="sm:hidden">Batch</span>
                        </button>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white text-sm sm:text-base rounded-lg hover:bg-primary-700"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Tambah Indukan</span>
                            <span className="sm:hidden">Tambah</span>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Cari ID indukan atau ras..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Stats Cards - Clickable Tab Filters */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                    {/* Di Farm Card */}
                    <div
                        onClick={() => { setActiveTab('infarm'); setFilterSubStatus(null); }}
                        className={`bg-white p-3 sm:p-6 rounded-lg shadow-sm border-2 text-left transition-all cursor-pointer ${activeTab === 'infarm' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Di Farm</p>
                        <p className="text-xl sm:text-3xl font-bold text-green-600">
                            {livestock.filter((l) => l.status_farm === 'infarm').length}
                        </p>
                        <div className="flex gap-2 sm:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 flex-wrap">
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveTab('infarm'); setFilterSubStatus('jantan'); }}
                                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium transition-colors ${activeTab === 'infarm' && filterSubStatus === 'jantan'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                ♂ {livestock.filter((l) => l.status_farm === 'infarm' && l.gender === 'jantan').length}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveTab('infarm'); setFilterSubStatus('betina'); }}
                                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium transition-colors ${activeTab === 'infarm' && filterSubStatus === 'betina'
                                    ? 'bg-pink-500 text-white'
                                    : 'text-pink-600 hover:bg-pink-50'
                                    }`}
                            >
                                ♀ {livestock.filter((l) => l.status_farm === 'infarm' && l.gender === 'betina').length}
                            </button>
                        </div>
                    </div>

                    {/* Keluar Card */}
                    <div
                        onClick={() => { setActiveTab('keluar'); setFilterSubStatus(null); }}
                        className={`bg-white p-3 sm:p-6 rounded-lg shadow-sm border-2 text-left transition-all cursor-pointer ${activeTab === 'keluar' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Keluar</p>
                        <p className="text-xl sm:text-3xl font-bold text-red-600">
                            {livestock.filter((l) => l.status_farm !== 'infarm').length}
                        </p>
                        <div className="flex gap-2 sm:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 flex-wrap">
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveTab('keluar'); setFilterSubStatus('terjual'); }}
                                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium transition-colors ${activeTab === 'keluar' && filterSubStatus === 'terjual'
                                    ? 'bg-orange-500 text-white'
                                    : 'text-orange-600 hover:bg-orange-50'
                                    }`}
                            >
                                Jual {livestock.filter((l) => l.status_farm === 'terjual').length}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveTab('keluar'); setFilterSubStatus('mati'); }}
                                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium transition-colors ${activeTab === 'keluar' && filterSubStatus === 'mati'
                                    ? 'bg-gray-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Mati {livestock.filter((l) => l.status_farm === 'mati').length}
                            </button>
                        </div>
                    </div>

                    {/* Total Indukan Card */}
                    <button
                        onClick={() => { setActiveTab('all'); setFilterSubStatus(null); }}
                        className={`bg-white p-3 sm:p-6 rounded-lg shadow-sm border-2 text-left transition-all ${activeTab === 'all' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total</p>
                        <p className="text-xl sm:text-3xl font-bold text-primary-600">{livestock.length}</p>
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">Semua Record</p>
                        </div>
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {filteredLivestock.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">
                                {searchTerm || selectedGenders.length > 0 || selectedStatuses.length > 0
                                    ? 'Tidak ada data yang cocok dengan filter'
                                    : 'Belum ada data indukan'}
                            </p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Tambah Indukan Pertama
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View - Improved Design */}
                            <div className="sm:hidden">
                                {filteredLivestock.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`p-3 ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                                    >
                                        <div
                                            onClick={() => setSelectedLivestock(item)}
                                            className="cursor-pointer active:opacity-70"
                                        >
                                            {/* Top row: ID + Weight */}
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-base font-bold ${item.gender === 'jantan' ? 'text-blue-600' : 'text-pink-600'}`}>
                                                        {item.gender === 'jantan' ? '♂' : '♀'} {item.id_indukan}
                                                    </span>
                                                    {isNew(item.created_at) && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500 text-white">
                                                            NEW
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {item.latest_weight || item.weight_kg ? `${item.latest_weight || item.weight_kg} kg` : '-'}
                                                </span>
                                            </div>
                                            {/* Bottom row: Date + Age */}
                                            <p className="text-xs text-gray-500 mb-2">
                                                {new Date(item.birth_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} · {calculateAge(item.birth_date)}
                                            </p>
                                        </div>
                                        {/* Status dropdown */}
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <StatusDropdown
                                                value={item.status}
                                                options={item.gender === 'jantan' ? maleStatusOptions : femaleStatusOptions}
                                                onChange={(value) => updateStatus(item.id, 'status', value)}
                                                compact
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ID Indukan
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tanggal Lahir
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bobot
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredLivestock.map((item) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => setSelectedLivestock(item)}
                                            className="hover:bg-gray-50 cursor-pointer"
                                        >
                                            {/* ID Indukan */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex items-center gap-1.5 font-mono font-semibold ${item.gender === 'jantan'
                                                        ? 'text-blue-600'
                                                        : 'text-pink-600'
                                                        }`}>
                                                        <span className="text-lg">
                                                            {item.gender === 'jantan' ? '♂' : '♀'}
                                                        </span>
                                                        {item.id_indukan}
                                                    </span>
                                                    {isNew(item.created_at) && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            BARU
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Tanggal Lahir + Umur */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(item.birth_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {calculateAge(item.birth_date)}
                                                </div>
                                            </td>

                                            {/* Bobot */}
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                {item.latest_weight
                                                    ? `${item.latest_weight} kg`
                                                    : item.weight_kg
                                                        ? `${item.weight_kg} kg`
                                                        : '-'
                                                }
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <StatusDropdown
                                                    value={item.status}
                                                    options={item.gender === 'jantan' ? maleStatusOptions : femaleStatusOptions}
                                                    onChange={(value) => updateStatus(item.id, 'status', value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <LivestockAddForm
                        onClose={() => setShowAddForm(false)}
                        onSuccess={() => {
                            invalidateLivestock()
                            setShowAddForm(false)
                        }}
                    />
                )}

                {/* Detail Modal */}
                {selectedLivestock && (
                    <LivestockDetailModal
                        livestock={selectedLivestock}
                        onClose={() => setSelectedLivestock(null)}
                        onDelete={() => {
                            invalidateLivestock()
                            setSelectedLivestock(null)
                        }}
                    />
                )}

                {/* Batch Sell Modal */}
                {showBatchSell && (
                    <BatchSellForm
                        type="livestock"
                        onClose={() => setShowBatchSell(false)}
                        onSuccess={() => {
                            invalidateLivestock()
                            setShowBatchSell(false)
                        }}
                    />
                )}
            </div>
        </div >
    )
}
