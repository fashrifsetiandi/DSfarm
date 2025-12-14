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
        livestock: 0,
        offspring: 0,
        kandang: 0,
        totalIncome: 0,
        totalExpense: 0,
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
            const [livestockRes, offspringRes, kandangRes, transactionsRes] = await Promise.all([
                supabase.from('livestock').select('id', { count: 'exact', head: true }),
                supabase.from('offspring').select('id', { count: 'exact', head: true }),
                supabase.from('kandang').select('id', { count: 'exact', head: true }),
                supabase.from('financial_transactions').select('transaction_type, amount'),
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
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Selamat datang di RUBY Farm, {user?.email}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Users className="h-8 w-8 text-blue-600" />
                            <span className="text-3xl font-bold text-gray-900">{stats.livestock}</span>
                        </div>
                        <h3 className="text-gray-600 font-medium">Indukan</h3>
                        <p className="text-sm text-gray-500 mt-1">Total kelinci indukan</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Baby className="h-8 w-8 text-pink-600" />
                            <span className="text-3xl font-bold text-gray-900">{stats.offspring}</span>
                        </div>
                        <h3 className="text-gray-600 font-medium">Anakan</h3>
                        <p className="text-sm text-gray-500 mt-1">Total kelinci anakan</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Home className="h-8 w-8 text-green-600" />
                            <span className="text-3xl font-bold text-gray-900">{stats.kandang}</span>
                        </div>
                        <h3 className="text-gray-600 font-medium">Kandang</h3>
                        <p className="text-sm text-gray-500 mt-1">Total kandang tersedia</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <DollarSign className="h-8 w-8 text-purple-600" />
                            <span className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {balance >= 0 ? '+' : ''}
                                {(balance / 1000000).toFixed(1)}M
                            </span>
                        </div>
                        <h3 className="text-gray-600 font-medium">Saldo</h3>
                        <p className="text-sm text-gray-500 mt-1">Balance keuangan</p>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Total Pemasukan</h3>
                        </div>
                        <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <TrendingDown className="h-6 w-6 text-red-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Total Pengeluaran</h3>
                        </div>
                        <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
                    </div>
                </div>

                {/* Quick Add Actions */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">⚡ Aksi Cepat</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Tambah Breeding */}
                        <button
                            onClick={() => handleQuickAction('breeding')}
                            className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left"
                        >
                            <div className="bg-blue-600 p-3 rounded-lg">
                                <Baby className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-blue-900">Tambah Breeding</p>
                                <p className="text-sm text-blue-600 mt-1">Catat perkawinan baru</p>
                            </div>
                        </button>

                        {/* Catat Kesehatan */}
                        <button
                            onClick={() => handleQuickAction('health')}
                            className="p-6 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left"
                        >
                            <div className="bg-red-600 p-3 rounded-lg">
                                <HeartPulse className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-red-900">Riwayat Kesehatan</p>
                                <p className="text-sm text-red-600 mt-1">Indukan / Anakan</p>
                            </div>
                        </button>

                        {/* Catat Pertumbuhan */}
                        <button
                            onClick={() => handleQuickAction('growth')}
                            className="p-6 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left"
                        >
                            <div className="bg-green-600 p-3 rounded-lg">
                                <Scale className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-green-900">Catat Pertumbuhan</p>
                                <p className="text-sm text-green-600 mt-1">Indukan / Anakan</p>
                            </div>
                        </button>

                        {/* Jual */}
                        <button
                            onClick={() => handleQuickAction('sell')}
                            className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left"
                        >
                            <div className="bg-orange-600 p-3 rounded-lg">
                                <ShoppingCart className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-orange-900">Jual Kelinci</p>
                                <p className="text-sm text-orange-600 mt-1">Indukan / Anakan</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <a href="/livestock" className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors">
                            <Users className="h-8 w-8 text-primary-600 mb-2" />
                            <span className="text-sm font-medium">Indukan</span>
                        </a>
                        <a href="/offspring" className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors">
                            <Baby className="h-8 w-8 text-primary-600 mb-2" />
                            <span className="text-sm font-medium">Anakan</span>
                        </a>
                        <a href="/finance" className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors">
                            <DollarSign className="h-8 w-8 text-primary-600 mb-2" />
                            <span className="text-sm font-medium">Keuangan</span>
                        </a>
                        <a href="/inventory" className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors">
                            <Package className="h-8 w-8 text-primary-600 mb-2" />
                            <span className="text-sm font-medium">Inventori</span>
                        </a>
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
