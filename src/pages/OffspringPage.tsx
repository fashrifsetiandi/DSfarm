import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { OffspringDetailModal } from '@/components/offspring/OffspringDetailModal'
import { OffspringAddForm } from '@/components/offspring/OffspringAddForm'

import { BatchSellForm } from '@/components/shared/BatchSellForm'
import { calculateAge } from '@/utils/dateUtils'
import { useOffspringList, useInvalidateOffspring } from '@/hooks/useQueries'

interface Offspring {
    id: string
    id_anakan: string
    gender: 'jantan' | 'betina' | null
    birth_date: string
    generation: number
    status_farm: string
    weight_kg: number | null
    latest_weight?: number | null  // From offspring_growth_logs
    created_at: string
    settings_breeds?: {
        breed_name: string
        breed_code: string
    }
    mother_livestock?: {
        id_indukan: string
    }
    father_livestock?: {
        id_indukan: string
    }
}

export function OffspringPage() {
    const { data: offspring = [], isLoading: loading, refetch } = useOffspringList()
    const invalidateOffspring = useInvalidateOffspring()
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState<'infarm' | 'keluar' | 'all'>('infarm')
    const [filterSubStatus, setFilterSubStatus] = useState<string | null>(null)
    const [selectedOffspringId, setSelectedOffspringId] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [showBatchSell, setShowBatchSell] = useState(false)

    // Status categories
    const infarmStatuses = ['anakan', 'pertumbuhan', 'siap_jual']
    const keluarStatuses = ['terjual', 'mati', 'promosi']

    // Calculate expected status based on age (semi-automatic)
    // 0-1 bulan: anakan, 1-3 bulan: pertumbuhan, 3+ bulan: siap_jual
    const getStatusByAge = (birthDate: string): 'anakan' | 'pertumbuhan' | 'siap_jual' => {
        const birth = new Date(birthDate)
        const now = new Date()
        const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
        const dayDiff = now.getDate() - birth.getDate()
        const adjustedMonths = dayDiff < 0 ? ageInMonths - 1 : ageInMonths

        if (adjustedMonths < 1) return 'anakan'           // 0-1 bulan: Anakan Baru
        if (adjustedMonths < 3) return 'pertumbuhan'      // 1-3 bulan: Pertumbuhan
        return 'siap_jual'                                 // 3+ bulan: Siap Jual
    }

    // Get counts for each status
    const statusCounts = {
        anakan: offspring.filter((o) => o.status_farm === 'anakan').length,
        pertumbuhan: offspring.filter((o) => o.status_farm === 'pertumbuhan').length,
        siap_jual: offspring.filter((o) => o.status_farm === 'siap_jual').length,
        terjual: offspring.filter((o) => o.status_farm === 'terjual').length,
        mati: offspring.filter((o) => o.status_farm === 'mati').length,
        promosi: offspring.filter((o) => o.status_farm === 'promosi').length,
    }

    const infarmCount = statusCounts.anakan + statusCounts.pertumbuhan + statusCounts.siap_jual
    const keluarCount = statusCounts.terjual + statusCounts.mati + statusCounts.promosi

    const filteredOffspring = offspring.filter((item) => {
        const matchesSearch =
            item.id_anakan?.toLowerCase().includes(searchTerm.toLowerCase())

        // Tab filter
        let matchesTab = true
        if (activeTab === 'infarm') {
            matchesTab = infarmStatuses.includes(item.status_farm)
            if (filterSubStatus) {
                matchesTab = item.status_farm === filterSubStatus
            }
        } else if (activeTab === 'keluar') {
            matchesTab = keluarStatuses.includes(item.status_farm)
            if (filterSubStatus) {
                matchesTab = item.status_farm === filterSubStatus
            }
        }
        // 'all' tab shows everything

        return matchesSearch && matchesTab
    })

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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Anakan</h1>
                        <p className="text-gray-600 text-sm mt-1">Lihat dan kelola data kelinci anakan</p>
                    </div>
                    <button
                        onClick={() => setShowBatchSell(true)}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-orange-600 text-white text-sm sm:text-base rounded-lg hover:bg-orange-700"
                    >
                        <DollarSign className="h-4 w-4" />
                        <span className="hidden sm:inline">Jual Batch</span>
                        <span className="sm:hidden">Batch</span>
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari ID Anakan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* Stats Cards - Horizontal scroll on mobile, grid on desktop */}
                <div className="mb-4 sm:mb-6">
                    {/* Mobile: Horizontal scroll */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide sm:hidden">
                        {/* Di Farm */}
                        <button
                            onClick={() => { setActiveTab('infarm'); setFilterSubStatus(null); }}
                            className={`flex-shrink-0 w-28 bg-white p-3 rounded-xl shadow-sm border-2 text-left transition-all ${activeTab === 'infarm' ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}
                        >
                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Di Farm</p>
                            <p className="text-2xl font-bold text-green-600 mt-0.5">{infarmCount}</p>
                        </button>

                        {/* Sub-status buttons */}
                        <button
                            onClick={() => { setActiveTab('infarm'); setFilterSubStatus('anakan'); }}
                            className={`flex-shrink-0 w-20 bg-white p-3 rounded-xl shadow-sm border-2 text-left transition-all ${activeTab === 'infarm' && filterSubStatus === 'anakan' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-100'}`}
                        >
                            <p className="text-[10px] font-medium text-gray-500">Anakan</p>
                            <p className="text-xl font-bold text-yellow-600 mt-0.5">{statusCounts.anakan}</p>
                        </button>
                        <button
                            onClick={() => { setActiveTab('infarm'); setFilterSubStatus('pertumbuhan'); }}
                            className={`flex-shrink-0 w-20 bg-white p-3 rounded-xl shadow-sm border-2 text-left transition-all ${activeTab === 'infarm' && filterSubStatus === 'pertumbuhan' ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}
                        >
                            <p className="text-[10px] font-medium text-gray-500">Tumbuh</p>
                            <p className="text-xl font-bold text-blue-600 mt-0.5">{statusCounts.pertumbuhan}</p>
                        </button>
                        <button
                            onClick={() => { setActiveTab('infarm'); setFilterSubStatus('siap_jual'); }}
                            className={`flex-shrink-0 w-20 bg-white p-3 rounded-xl shadow-sm border-2 text-left transition-all ${activeTab === 'infarm' && filterSubStatus === 'siap_jual' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
                        >
                            <p className="text-[10px] font-medium text-gray-500">Siap</p>
                            <p className="text-xl font-bold text-orange-600 mt-0.5">{statusCounts.siap_jual}</p>
                        </button>

                        {/* Divider */}
                        <div className="flex-shrink-0 w-px bg-gray-200 mx-1" />

                        {/* Keluar */}
                        <button
                            onClick={() => { setActiveTab('keluar'); setFilterSubStatus('terjual'); }}
                            className={`flex-shrink-0 w-20 bg-white p-3 rounded-xl shadow-sm border-2 text-left transition-all ${activeTab === 'keluar' && filterSubStatus === 'terjual' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
                        >
                            <p className="text-[10px] font-medium text-gray-500">Jual</p>
                            <p className="text-xl font-bold text-orange-600 mt-0.5">{statusCounts.terjual}</p>
                        </button>
                        <button
                            onClick={() => { setActiveTab('keluar'); setFilterSubStatus('promosi'); }}
                            className={`flex-shrink-0 w-20 bg-white p-3 rounded-xl shadow-sm border-2 text-left transition-all ${activeTab === 'keluar' && filterSubStatus === 'promosi' ? 'border-purple-500 bg-purple-50' : 'border-gray-100'}`}
                        >
                            <p className="text-[10px] font-medium text-gray-500">Promo</p>
                            <p className="text-xl font-bold text-purple-600 mt-0.5">{statusCounts.promosi}</p>
                        </button>

                        {/* Total */}
                        <button
                            onClick={() => { setActiveTab('all'); setFilterSubStatus(null); }}
                            className={`flex-shrink-0 w-20 bg-white p-3 rounded-xl shadow-sm border-2 text-left transition-all ${activeTab === 'all' ? 'border-primary-500 bg-primary-50' : 'border-gray-100'}`}
                        >
                            <p className="text-[10px] font-medium text-gray-500">Total</p>
                            <p className="text-xl font-bold text-primary-600 mt-0.5">{offspring.length}</p>
                        </button>
                    </div>

                    {/* Desktop: Grid layout */}
                    <div className="hidden sm:grid grid-cols-3 gap-4">
                        {/* Di Farm Card */}
                        <div
                            onClick={() => { setActiveTab('infarm'); setFilterSubStatus(null); }}
                            className={`bg-white p-6 rounded-lg shadow-sm border-2 text-left transition-all cursor-pointer ${activeTab === 'infarm' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <p className="text-sm font-medium text-gray-600 mb-1">Di Farm</p>
                            <p className="text-3xl font-bold text-green-600">{infarmCount}</p>
                            <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-gray-100">
                                <button onClick={(e) => { e.stopPropagation(); setActiveTab('infarm'); setFilterSubStatus('anakan'); }} className={`px-2 py-1 rounded text-xs font-medium ${activeTab === 'infarm' && filterSubStatus === 'anakan' ? 'bg-yellow-500 text-white' : 'text-yellow-600 hover:bg-yellow-50'}`}>
                                    Anakan {statusCounts.anakan}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setActiveTab('infarm'); setFilterSubStatus('pertumbuhan'); }} className={`px-2 py-1 rounded text-xs font-medium ${activeTab === 'infarm' && filterSubStatus === 'pertumbuhan' ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50'}`}>
                                    Tumbuh {statusCounts.pertumbuhan}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setActiveTab('infarm'); setFilterSubStatus('siap_jual'); }} className={`px-2 py-1 rounded text-xs font-medium ${activeTab === 'infarm' && filterSubStatus === 'siap_jual' ? 'bg-green-500 text-white' : 'text-green-600 hover:bg-green-50'}`}>
                                    Siap {statusCounts.siap_jual}
                                </button>
                            </div>
                        </div>

                        {/* Keluar Card */}
                        <div
                            onClick={() => { setActiveTab('keluar'); setFilterSubStatus(null); }}
                            className={`bg-white p-6 rounded-lg shadow-sm border-2 text-left transition-all cursor-pointer ${activeTab === 'keluar' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <p className="text-sm font-medium text-gray-600 mb-1">Keluar</p>
                            <p className="text-3xl font-bold text-red-600">{keluarCount}</p>
                            <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-gray-100">
                                <button onClick={(e) => { e.stopPropagation(); setActiveTab('keluar'); setFilterSubStatus('terjual'); }} className={`px-2 py-1 rounded text-xs font-medium ${activeTab === 'keluar' && filterSubStatus === 'terjual' ? 'bg-orange-500 text-white' : 'text-orange-600 hover:bg-orange-50'}`}>
                                    Jual {statusCounts.terjual}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setActiveTab('keluar'); setFilterSubStatus('promosi'); }} className={`px-2 py-1 rounded text-xs font-medium ${activeTab === 'keluar' && filterSubStatus === 'promosi' ? 'bg-purple-500 text-white' : 'text-purple-600 hover:bg-purple-50'}`}>
                                    Promosi {statusCounts.promosi}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setActiveTab('keluar'); setFilterSubStatus('mati'); }} className={`px-2 py-1 rounded text-xs font-medium ${activeTab === 'keluar' && filterSubStatus === 'mati' ? 'bg-gray-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    Mati {statusCounts.mati}
                                </button>
                            </div>
                        </div>

                        {/* Total Card */}
                        <button
                            onClick={() => { setActiveTab('all'); setFilterSubStatus(null); }}
                            className={`bg-white p-6 rounded-lg shadow-sm border-2 text-left transition-all ${activeTab === 'all' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                            <p className="text-3xl font-bold text-primary-600">{offspring.length}</p>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500">Semua</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {filteredOffspring.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">
                                {searchTerm || filterSubStatus !== null
                                    ? 'Tidak ada data yang cocok dengan filter'
                                    : 'Belum ada data anakan'}
                            </p>
                            {!searchTerm && filterSubStatus === null && (
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Tambahkan anakan pertama dari:
                                    </p>
                                    <div className="flex gap-2 justify-center text-sm flex-wrap">
                                        <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded">
                                            Dashboard → Tambah Breeding
                                        </span>
                                        <span className="text-gray-400">atau</span>
                                        <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded">
                                            Menu Indukan → Breeding Tab
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View - Compact 2-Row Design */}
                            <div className="sm:hidden">
                                {filteredOffspring.map((item, index) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedOffspringId(item.id)}
                                        className={`p-3 cursor-pointer active:bg-gray-50 ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                                    >
                                        {/* Row 1: ID + Weight */}
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                                                <span className={`text-sm font-bold truncate ${item.gender === 'jantan' ? 'text-blue-600' : 'text-pink-600'}`}>
                                                    {item.gender === 'jantan' ? '♂' : '♀'} {item.id_anakan}
                                                </span>
                                                {isNew(item.created_at) && (
                                                    <span className="flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-semibold bg-green-500 text-white">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                            <span className="flex-shrink-0 text-sm font-semibold text-gray-700">
                                                {item.latest_weight || item.weight_kg ? `${item.latest_weight || item.weight_kg} kg` : '-'}
                                            </span>
                                        </div>
                                        {/* Row 2: Date/Age + Status Badge (read-only, auto-calculated by age) */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">
                                                {format(new Date(item.birth_date), 'dd MMM yyyy')} · {calculateAge(item.birth_date)}
                                            </span>
                                            {/* Status Badge - Read only since status is auto-calculated */}
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status_farm === 'anakan' ? 'bg-yellow-100 text-yellow-700' :
                                                item.status_farm === 'pertumbuhan' ? 'bg-blue-100 text-blue-700' :
                                                    item.status_farm === 'siap_jual' ? 'bg-orange-100 text-orange-700' :
                                                        item.status_farm === 'terjual' ? 'bg-green-100 text-green-700' :
                                                            item.status_farm === 'mati' ? 'bg-gray-100 text-gray-700' :
                                                                item.status_farm === 'promosi' ? 'bg-purple-100 text-purple-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {item.status_farm === 'anakan' ? '🐣 Anakan' :
                                                    item.status_farm === 'pertumbuhan' ? '📈 Tumbuh' :
                                                        item.status_farm === 'siap_jual' ? '🛒 Siap Jual' :
                                                            item.status_farm === 'terjual' ? '✅ Terjual' :
                                                                item.status_farm === 'mati' ? '💀 Mati' :
                                                                    item.status_farm === 'promosi' ? '⬆️ Promosi' :
                                                                        item.status_farm}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ID Anakan
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
                                    {filteredOffspring.map((item) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => setSelectedOffspringId(item.id)}
                                            className="hover:bg-gray-50 cursor-pointer"
                                        >
                                            {/* ID Anakan with Gender Icon */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex items-center gap-1.5 font-mono font-semibold ${item.gender === 'jantan'
                                                        ? 'text-blue-600'
                                                        : 'text-pink-600'
                                                        }`}>
                                                        <span className="text-lg">
                                                            {item.gender === 'jantan' ? '♂' : '♀'}
                                                        </span>
                                                        {item.id_anakan}
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
                                                    {format(new Date(item.birth_date), 'dd MMM yyyy')}
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

                                            {/* Status Badge - Read only since status is auto-calculated */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status_farm === 'anakan' ? 'bg-yellow-100 text-yellow-700' :
                                                    item.status_farm === 'pertumbuhan' ? 'bg-blue-100 text-blue-700' :
                                                        item.status_farm === 'siap_jual' ? 'bg-orange-100 text-orange-700' :
                                                            item.status_farm === 'terjual' ? 'bg-green-100 text-green-700' :
                                                                item.status_farm === 'mati' ? 'bg-gray-100 text-gray-700' :
                                                                    item.status_farm === 'promosi' ? 'bg-purple-100 text-purple-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {item.status_farm === 'anakan' ? '🐣 Anakan' :
                                                        item.status_farm === 'pertumbuhan' ? '📈 Tumbuh' :
                                                            item.status_farm === 'siap_jual' ? '🛒 Siap Jual' :
                                                                item.status_farm === 'terjual' ? '✅ Terjual' :
                                                                    item.status_farm === 'mati' ? '💀 Mati' :
                                                                        item.status_farm === 'promosi' ? '⬆️ Promosi' :
                                                                            item.status_farm}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )
                    }
                </div >
            </div >

            {/* Detail Modal */}
            {
                selectedOffspringId && (
                    <OffspringDetailModal
                        offspringId={selectedOffspringId}
                        onClose={() => {
                            setSelectedOffspringId(null)
                            invalidateOffspring() // Refresh data after close
                        }}
                    />
                )
            }

            {/* Batch Sell Modal */}
            {
                showBatchSell && (
                    <BatchSellForm
                        type="offspring"
                        onClose={() => setShowBatchSell(false)}
                        onSuccess={() => {
                            invalidateOffspring()
                            setShowBatchSell(false)
                        }}
                    />
                )
            }
        </div >
    )
}
