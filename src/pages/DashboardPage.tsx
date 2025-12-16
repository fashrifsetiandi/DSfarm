import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Users, Baby, Home, DollarSign, TrendingUp, TrendingDown, Package, HeartPulse, Scale, X, ShoppingCart } from 'lucide-react'
import { LivestockSelector } from '@/components/common/LivestockSelector'
import { OffspringSelector } from '@/components/common/OffspringSelector'
import { BreedingRecordForm } from '@/components/livestock/BreedingRecordForm'
import { HealthRecordForm } from '@/components/livestock/HealthRecordForm'
import { GrowthLogForm } from '@/components/livestock/GrowthLogForm'
import { OffspringGrowthLogForm } from '@/components/offspring/OffspringGrowthLogForm'
import { OffspringHealthRecordForm } from '@/components/offspring/OffspringHealthRecordForm'
import { SellLivestockForm } from '@/components/livestock/SellLivestockForm'
import { SellOffspringForm } from '@/components/offspring/SellOffspringForm'

type ActionType = 'breeding' | 'health' | 'growth' | 'sell' | null
type TargetType = 'indukan' | 'anakan' | null

export function DashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        livestock: 0,       // Infarm only
        offspring: 0,       // Infarm only
        kandang: 0,
        totalIncome: 0,
        totalExpense: 0,
    })
    // Production stats - all time records
    const [productionStats, setProductionStats] = useState({
        totalOffspring: 0,  // All offspring ever
        terjual: 0,         // Sold
        mati: 0,            // Dead
        promosi: 0,         // Promoted to breeding stock
    })
    const [loading, setLoading] = useState(true)

    // Combined selector states
    const [showTypeSelector, setShowTypeSelector] = useState<ActionType>(null)
    const [_selectedTarget, setSelectedTarget] = useState<TargetType>(null)
    const [showLivestockSelector, setShowLivestockSelector] = useState(false)
    const [showOffspringSelector, setShowOffspringSelector] = useState(false)

    // Selected items
    const [selectedLivestock, setSelectedLivestock] = useState<{ id: string; code: string; birth_date?: string } | null>(null)
    const [selectedOffspring, setSelectedOffspring] = useState<{ id: string; code: string; birth_date?: string } | null>(null)

    // Form states
    const [showBreedingForm, setShowBreedingForm] = useState(false)
    const [showHealthForm, setShowHealthForm] = useState(false)
    const [showGrowthForm, setShowGrowthForm] = useState(false)
    const [showOffspringHealthForm, setShowOffspringHealthForm] = useState(false)
    const [showOffspringGrowthForm, setShowOffspringGrowthForm] = useState(false)
    const [showSellLivestockForm, setShowSellLivestockForm] = useState(false)
    const [showSellOffspringForm, setShowSellOffspringForm] = useState(false)

    useEffect(() => {
        if (user) {
            fetchStats()
        }
    }, [user])

    const fetchStats = async () => {
        try {
            // Offspring uses different status values: ['anakan', 'pertumbuhan', 'siap_jual'] = infarm
            const offspringInfarmStatuses = ['anakan', 'pertumbuhan', 'siap_jual']

            // Fetch main stats - filter to INFARM only for livestock/offspring
            const [livestockRes, offspringRes, kandangRes, transactionsRes] = await Promise.all([
                supabase.from('livestock').select('id', { count: 'exact', head: true }).eq('status_farm', 'infarm'),
                supabase.from('offspring').select('id', { count: 'exact', head: true }).in('status_farm', offspringInfarmStatuses),
                supabase.from('kandang').select('id', { count: 'exact', head: true }),
                supabase.from('financial_transactions').select('transaction_type, amount'),
            ])

            // Fetch production breakdown - all offspring by status
            const [totalRes, terjualRes, matiRes, promosiRes] = await Promise.all([
                supabase.from('offspring').select('id', { count: 'exact', head: true }),
                supabase.from('offspring').select('id', { count: 'exact', head: true }).eq('status_farm', 'terjual'),
                supabase.from('offspring').select('id', { count: 'exact', head: true }).eq('status_farm', 'mati'),
                supabase.from('offspring').select('id', { count: 'exact', head: true }).eq('status_farm', 'promosi'),
            ])

            const transactions = (transactionsRes.data || []) as Array<{ transaction_type: string; amount: number }>
            const income = transactions.filter((t) => t.transaction_type === 'income').reduce((sum, t) => sum + t.amount, 0)
            const expense = transactions.filter((t) => t.transaction_type === 'expense').reduce((sum, t) => sum + t.amount, 0)

            setStats({
                livestock: livestockRes.count || 0,
                offspring: offspringRes.count || 0,
                kandang: kandangRes.count || 0,
                totalIncome: income,
                totalExpense: expense,
            })

            setProductionStats({
                totalOffspring: totalRes.count || 0,
                terjual: terjualRes.count || 0,
                mati: matiRes.count || 0,
                promosi: promosiRes.count || 0,
            })
        } catch (err) {
            console.error('Error fetching stats:', err)
        } finally {
            setLoading(false)
        }
    }

    // Track pending action
    const [pendingAction, setPendingAction] = useState<ActionType>(null)

    const handleQuickAction = (action: ActionType) => {
        setPendingAction(action)
        if (action === 'breeding') {
            setShowLivestockSelector(true)
        } else if (action === 'sell') {
            setShowTypeSelector(action)
        } else {
            setShowTypeSelector(action)
        }
    }

    const handleTargetChoice = (target: TargetType) => {
        setSelectedTarget(target)
        setShowTypeSelector(null)

        if (target === 'indukan') {
            setShowLivestockSelector(true)
        } else {
            setShowOffspringSelector(true)
        }
    }

    const onLivestockSelected = (livestockId: string, livestockCode: string) => {
        setSelectedLivestock({ id: livestockId, code: livestockCode })
        setShowLivestockSelector(false)

        if (pendingAction === 'breeding') {
            setShowBreedingForm(true)
        } else if (pendingAction === 'health') {
            setShowHealthForm(true)
        } else if (pendingAction === 'growth') {
            setShowGrowthForm(true)
        } else if (pendingAction === 'sell') {
            setShowSellLivestockForm(true)
        }
    }

    const onOffspringSelected = (offspringId: string, offspringCode: string) => {
        setSelectedOffspring({ id: offspringId, code: offspringCode })
        setShowOffspringSelector(false)

        if (pendingAction === 'health') {
            setShowOffspringHealthForm(true)
        } else if (pendingAction === 'growth') {
            setShowOffspringGrowthForm(true)
        } else if (pendingAction === 'sell') {
            setShowSellOffspringForm(true)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const balance = stats.totalIncome - stats.totalExpense

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-3 xs:px-4 py-4 xs:py-6 sm:py-8">
                {/* Welcome */}
                <div className="mb-4 xs:mb-6 sm:mb-8">
                    <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-1">Selamat datang, {user?.email?.split('@')[0]}</p>
                </div>

                {/* Stats Grid - Shows INFARM counts only */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-6 mb-4 xs:mb-6 sm:mb-8">
                    <div className="bg-white rounded-lg shadow p-3 xs:p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-1.5 xs:mb-2 sm:mb-4">
                            <Users className="h-5 w-5 xs:h-6 xs:w-6 sm:h-8 sm:w-8 text-blue-600" />
                            <span className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">{stats.livestock}</span>
                        </div>
                        <h3 className="text-gray-600 font-medium text-xs xs:text-sm sm:text-base">Indukan</h3>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500 mt-0.5">di farm</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-3 xs:p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-1.5 xs:mb-2 sm:mb-4">
                            <Baby className="h-5 w-5 xs:h-6 xs:w-6 sm:h-8 sm:w-8 text-pink-600" />
                            <span className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">{stats.offspring}</span>
                        </div>
                        <h3 className="text-gray-600 font-medium text-xs xs:text-sm sm:text-base">Anakan</h3>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500 mt-0.5">di farm</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-3 xs:p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-1.5 xs:mb-2 sm:mb-4">
                            <Home className="h-5 w-5 xs:h-6 xs:w-6 sm:h-8 sm:w-8 text-green-600" />
                            <span className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">{stats.kandang}</span>
                        </div>
                        <h3 className="text-gray-600 font-medium text-xs xs:text-sm sm:text-base">Kandang</h3>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500 mt-0.5">aktif</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-3 xs:p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-1.5 xs:mb-2 sm:mb-4">
                            <DollarSign className="h-5 w-5 xs:h-6 xs:w-6 sm:h-8 sm:w-8 text-purple-600" />
                            <span className={`text-lg xs:text-xl sm:text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {balance >= 0 ? '+' : ''}
                                {(balance / 1000000).toFixed(1)}M
                            </span>
                        </div>
                        <h3 className="text-gray-600 font-medium text-xs xs:text-sm sm:text-base">Saldo</h3>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500 mt-0.5">balance</p>
                    </div>
                </div>

                {/* Production Stats - All Time */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 xs:mb-6 sm:mb-8">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">📊 Rekap Produksi Anakan</h3>
                    <div className="grid grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
                        <div className="text-center p-2 xs:p-3 bg-gray-50 rounded-lg">
                            <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">{productionStats.totalOffspring}</p>
                            <p className="text-[10px] xs:text-xs text-gray-500">Total Lahir</p>
                        </div>
                        <div className="text-center p-2 xs:p-3 bg-orange-50 rounded-lg">
                            <p className="text-lg xs:text-xl sm:text-2xl font-bold text-orange-600">{productionStats.terjual}</p>
                            <p className="text-[10px] xs:text-xs text-gray-500">Terjual</p>
                        </div>
                        <div className="text-center p-2 xs:p-3 bg-red-50 rounded-lg">
                            <p className="text-lg xs:text-xl sm:text-2xl font-bold text-red-600">{productionStats.mati}</p>
                            <p className="text-[10px] xs:text-xs text-gray-500">Mati</p>
                        </div>
                        <div className="text-center p-2 xs:p-3 bg-green-50 rounded-lg">
                            <p className="text-lg xs:text-xl sm:text-2xl font-bold text-green-600">{productionStats.promosi}</p>
                            <p className="text-[10px] xs:text-xs text-gray-500">Promosi</p>
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-4 sm:p-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Total Pemasukan</h3>
                        </div>
                        <p className="text-xl sm:text-3xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-4 sm:p-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Total Pengeluaran</h3>
                        </div>
                        <p className="text-xl sm:text-3xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
                    </div>
                </div>

                {/* Quick Add Actions */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">⚡ Aksi Cepat</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        {/* Tambah Breeding */}
                        <button
                            onClick={() => handleQuickAction('breeding')}
                            className="p-3 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left"
                        >
                            <div className="bg-blue-600 p-2 sm:p-3 rounded-lg">
                                <Baby className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-blue-900 text-sm sm:text-base">Breeding</p>
                                <p className="text-xs sm:text-sm text-blue-600 mt-0.5 sm:mt-1 hidden sm:block">Catat perkawinan</p>
                            </div>
                        </button>

                        {/* Catat Kesehatan */}
                        <button
                            onClick={() => handleQuickAction('health')}
                            className="p-3 sm:p-6 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left"
                        >
                            <div className="bg-red-600 p-2 sm:p-3 rounded-lg">
                                <HeartPulse className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-red-900 text-sm sm:text-base">Kesehatan</p>
                                <p className="text-xs sm:text-sm text-red-600 mt-0.5 sm:mt-1 hidden sm:block">Indukan / Anakan</p>
                            </div>
                        </button>

                        {/* Catat Pertumbuhan */}
                        <button
                            onClick={() => handleQuickAction('growth')}
                            className="p-3 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left"
                        >
                            <div className="bg-green-600 p-2 sm:p-3 rounded-lg">
                                <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-green-900 text-sm sm:text-base">Pertumbuhan</p>
                                <p className="text-xs sm:text-sm text-green-600 mt-0.5 sm:mt-1 hidden sm:block">Indukan / Anakan</p>
                            </div>
                        </button>

                        {/* Jual */}
                        <button
                            onClick={() => handleQuickAction('sell')}
                            className="p-3 sm:p-6 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left"
                        >
                            <div className="bg-orange-600 p-2 sm:p-3 rounded-lg">
                                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-orange-900 text-sm sm:text-base">Jual</p>
                                <p className="text-xs sm:text-sm text-orange-600 mt-0.5 sm:mt-1 hidden sm:block">Indukan / Anakan</p>
                            </div>
                        </button>
                    </div>
                </div>



                {/* Type Selector Modal (Indukan/Anakan) */}
                {showTypeSelector && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {showTypeSelector === 'health' ? 'Catat Kesehatan' : 'Catat Pertumbuhan'}
                                </h2>
                                <button onClick={() => setShowTypeSelector(null)} className="p-1 hover:bg-gray-100 rounded">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-gray-600 mb-4">Pilih jenis kelinci:</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleTargetChoice('indukan')}
                                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-2"
                                >
                                    <Users className="h-10 w-10 text-blue-600" />
                                    <span className="font-semibold text-gray-900">Indukan</span>
                                </button>
                                <button
                                    onClick={() => handleTargetChoice('anakan')}
                                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all flex flex-col items-center gap-2"
                                >
                                    <Baby className="h-10 w-10 text-pink-600" />
                                    <span className="font-semibold text-gray-900">Anakan</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Livestock Selector */}
                {showLivestockSelector && (
                    <LivestockSelector
                        title={
                            pendingAction === 'breeding' ? 'Pilih Indukan Betina untuk Breeding' :
                                pendingAction === 'health' ? 'Pilih Indukan untuk Catat Kesehatan' :
                                    'Pilih Indukan untuk Catat Pertumbuhan'
                        }
                        filterGender={pendingAction === 'breeding' ? 'betina' : undefined}
                        onClose={() => {
                            setShowLivestockSelector(false)
                            setPendingAction(null)
                        }}
                        onSelect={onLivestockSelected}
                    />
                )}

                {/* Offspring Selector */}
                {showOffspringSelector && (
                    <OffspringSelector
                        title={
                            pendingAction === 'health' ? 'Pilih Anakan untuk Catat Kesehatan' :
                                'Pilih Anakan untuk Catat Pertumbuhan'
                        }
                        onClose={() => {
                            setShowOffspringSelector(false)
                            setPendingAction(null)
                        }}
                        onSelect={onOffspringSelected}
                    />
                )}

                {/* Livestock Forms */}
                {showBreedingForm && selectedLivestock && (
                    <BreedingRecordForm
                        livestockId={selectedLivestock.id}
                        motherBirthDate={selectedLivestock.birth_date || new Date().toISOString().split('T')[0]}
                        mode="create"
                        onClose={() => {
                            setShowBreedingForm(false)
                            setSelectedLivestock(null)
                            setPendingAction(null)
                        }}
                        onSuccess={() => {
                            setShowBreedingForm(false)
                            setSelectedLivestock(null)
                            setPendingAction(null)
                            fetchStats()
                        }}
                    />
                )}

                {showHealthForm && selectedLivestock && (
                    <HealthRecordForm
                        livestockId={selectedLivestock.id}
                        birthDate={selectedLivestock.birth_date || ''}
                        onClose={() => {
                            setShowHealthForm(false)
                            setSelectedLivestock(null)
                            setPendingAction(null)
                        }}
                        onSuccess={() => {
                            setShowHealthForm(false)
                            setSelectedLivestock(null)
                            setPendingAction(null)
                        }}
                    />
                )}

                {showGrowthForm && selectedLivestock && (
                    <GrowthLogForm
                        livestockId={selectedLivestock.id}
                        onClose={() => {
                            setShowGrowthForm(false)
                            setSelectedLivestock(null)
                            setPendingAction(null)
                        }}
                        onSuccess={() => {
                            setShowGrowthForm(false)
                            setSelectedLivestock(null)
                            setPendingAction(null)
                        }}
                    />
                )}

                {/* Offspring Forms */}
                {showOffspringHealthForm && selectedOffspring && (
                    <OffspringHealthRecordForm
                        offspringId={selectedOffspring.id}
                        birthDate={selectedOffspring.birth_date || ''}
                        onClose={() => {
                            setShowOffspringHealthForm(false)
                            setSelectedOffspring(null)
                            setPendingAction(null)
                        }}
                        onSuccess={() => {
                            setShowOffspringHealthForm(false)
                            setSelectedOffspring(null)
                            setPendingAction(null)
                        }}
                    />
                )}

                {showOffspringGrowthForm && selectedOffspring && (
                    <OffspringGrowthLogForm
                        offspringId={selectedOffspring.id}
                        onClose={() => {
                            setShowOffspringGrowthForm(false)
                            setSelectedOffspring(null)
                            setPendingAction(null)
                        }}
                        onSuccess={() => {
                            setShowOffspringGrowthForm(false)
                            setSelectedOffspring(null)
                            setPendingAction(null)
                        }}
                    />
                )}

                {/* Sell Livestock Form */}
                {showSellLivestockForm && selectedLivestock && (
                    <SellLivestockForm
                        livestockId={selectedLivestock.id}
                        livestockCode={selectedLivestock.code}
                        onClose={() => {
                            setShowSellLivestockForm(false)
                            setSelectedLivestock(null)
                            setPendingAction(null)
                        }}
                        onSuccess={() => {
                            setShowSellLivestockForm(false)
                            setSelectedLivestock(null)
                            setPendingAction(null)
                            fetchStats()
                        }}
                    />
                )}

                {/* Sell Offspring Form */}
                {showSellOffspringForm && selectedOffspring && (
                    <SellOffspringForm
                        offspringId={selectedOffspring.id}
                        offspringCode={selectedOffspring.code}
                        onClose={() => {
                            setShowSellOffspringForm(false)
                            setSelectedOffspring(null)
                            setPendingAction(null)
                        }}
                        onSuccess={() => {
                            setShowSellOffspringForm(false)
                            setSelectedOffspring(null)
                            setPendingAction(null)
                            fetchStats()
                        }}
                    />
                )}
            </div>
        </div>
    )
}
