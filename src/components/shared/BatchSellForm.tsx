/**
 * ======================================================
 * BATCH SELL FORM - Form Jual Batch Ternak
 * ======================================================
 * 
 * Form untuk menjual beberapa ternak sekaligus.
 * Mendukung anakan (offspring) dan indukan (livestock).
 * 
 * ======================================================
 */

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, DollarSign, Check, AlertCircle } from 'lucide-react'
import { getOffspringStatus } from '@/utils/dateUtils'

// ======================================================
// INTERFACES
// ======================================================

interface SellableItem {
    id: string
    code: string
    weight: number | null
    gender: string | null
}

interface SelectedItem extends SellableItem {
    price: string
}

interface Props {
    type: 'offspring' | 'livestock'
    onClose: () => void
    onSuccess: () => void
}

// ======================================================
// HELPER FUNCTIONS
// ======================================================

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

// ======================================================
// COMPONENT
// ======================================================

export function BatchSellForm({ type, onClose, onSuccess }: Props) {
    const { user } = useAuth()
    const isOffspring = type === 'offspring'

    // State
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState('')
    const [availableItems, setAvailableItems] = useState<SellableItem[]>([])
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
    const [samePrice, setSamePrice] = useState(true)
    const [defaultPrice, setDefaultPrice] = useState('')
    const [buyerName, setBuyerName] = useState('')
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])

    // Fetch available items on mount
    useEffect(() => {
        fetchAvailableItems()
    }, [type])

    const fetchAvailableItems = async () => {
        setFetching(true)
        try {
            if (isOffspring) {
                // Fetch ALL infarm offspring to calculate status client-side
                const { data, error } = await supabase
                    .from('offspring')
                    .select('id, id_anakan, weight_kg, gender, birth_date, status_farm')
                    .in('status_farm', ['anakan', 'pertumbuhan', 'siap_jual']) // Get all infarm
                    .order('id_anakan')

                if (error) throw error

                // Filter for 'siap_jual' based on age OR explicit status
                const readyToSell = (data || []).filter((item: any) => {
                    const calculatedStatus = getOffspringStatus(item.birth_date)
                    // Include if calculated is ready to sell OR explicitly marked ready (legacy)
                    return calculatedStatus === 'siap_jual' || item.status_farm === 'siap_jual'
                })

                setAvailableItems(readyToSell.map((item: any) => ({
                    id: item.id,
                    code: item.id_anakan,
                    weight: item.weight_kg,
                    gender: item.gender,
                })))
            } else {
                // For livestock, use id_indukan - exclude already sold or dead
                const { data, error } = await supabase
                    .from('livestock')
                    .select('id, id_indukan, weight_kg, gender, status')
                    .not('status', 'in', '(terjual,mati)')
                    .order('id_indukan')

                if (error) throw error

                setAvailableItems((data || []).map((item: any) => ({
                    id: item.id,
                    code: item.id_indukan,
                    weight: item.weight_kg,
                    gender: item.gender,
                })))
            }
        } catch (err) {
            console.error('Error fetching items:', err)
        } finally {
            setFetching(false)
        }
    }

    // Toggle item selection
    const toggleItem = (item: SellableItem) => {
        const isSelected = selectedItems.some(s => s.id === item.id)
        if (isSelected) {
            setSelectedItems(prev => prev.filter(s => s.id !== item.id))
        } else {
            setSelectedItems(prev => [...prev, { ...item, price: defaultPrice }])
        }
    }

    // Update individual price
    const updateItemPrice = (id: string, price: string) => {
        setSelectedItems(prev => prev.map(item =>
            item.id === id ? { ...item, price } : item
        ))
    }

    // Apply same price to all when toggled
    useEffect(() => {
        if (samePrice && defaultPrice) {
            setSelectedItems(prev => prev.map(item => ({ ...item, price: defaultPrice })))
        }
    }, [samePrice, defaultPrice])

    // Calculate total
    const total = useMemo(() => {
        return selectedItems.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0
            return sum + price
        }, 0)
    }, [selectedItems])

    // Handle submit
    const handleSubmit = async () => {
        if (selectedItems.length === 0) {
            setError('Pilih minimal 1 ternak untuk dijual')
            return
        }

        const itemsWithNoPrice = selectedItems.filter(item => !item.price || parseFloat(item.price) <= 0)
        if (itemsWithNoPrice.length > 0) {
            setError('Semua ternak yang dipilih harus memiliki harga')
            return
        }

        setLoading(true)
        setError('')

        try {
            const table = isOffspring ? 'offspring' : 'livestock'

            // Update status and clear kandang for all selected items
            // Clearing kandang_id triggers the occupancy decrement via database trigger
            for (const item of selectedItems) {
                // @ts-ignore
                await supabase
                    .from(table)
                    .update({
                        // Offspring uses status_farm, Livestock uses status
                        ...(isOffspring
                            ? { status_farm: 'terjual' }
                            : { status: 'terjual', status_farm: 'terjual' }
                        ),
                        kandang_id: null, // Clear kandang - triggers occupancy decrement
                        ...(isOffspring
                            ? { status_notes: `Dijual ke ${buyerName || 'pembeli'} pada ${saleDate}` }
                            : { notes: `Dijual ke ${buyerName || 'pembeli'} pada ${saleDate}` }
                        )
                    })
                    .eq('id', item.id)
            }

            // Get penjualan category
            const { data: category } = await supabase
                .from('settings_finance_categories')
                .select('id')
                .eq('category_code', 'PENJUALAN')
                .single()

            if (category) {
                const transactionCode = `TRX-${saleDate.replace(/-/g, '')}-${Date.now().toString().slice(-6)}`

                // Create single transaction for total amount
                // @ts-ignore
                await supabase
                    .from('financial_transactions')
                    .insert({
                        user_id: user?.id,
                        transaction_code: transactionCode,
                        category_id: category.id,
                        transaction_type: 'income',
                        amount: total,
                        transaction_date: saleDate,
                        description: `Jual batch ${selectedItems.length} ${isOffspring ? 'anakan' : 'indukan'} ke ${buyerName || 'pembeli'}. Kode: ${selectedItems.map(i => i.code).join(', ')}`,
                    })
            }

            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-6 w-6 text-white" />
                        <h2 className="text-xl font-bold text-white">
                            Jual Batch {isOffspring ? 'Anakan' : 'Indukan'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Same Price Toggle */}
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={samePrice}
                                onChange={(e) => setSamePrice(e.target.checked)}
                                className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm font-medium text-orange-800">Harga Sama Semua</span>
                        </label>
                        {samePrice && (
                            <input
                                type="number"
                                placeholder="Harga per ekor"
                                value={defaultPrice}
                                onChange={(e) => setDefaultPrice(e.target.value)}
                                className="mt-2 w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        )}
                    </div>

                    {/* Item List */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Ternak ({availableItems.length} tersedia)
                        </label>

                        {fetching ? (
                            <div className="text-center py-8 text-gray-500">Memuat data...</div>
                        ) : availableItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Tidak ada {isOffspring ? 'anakan' : 'indukan'} dengan status "siap jual"
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                {availableItems.map(item => {
                                    const selected = selectedItems.find(s => s.id === item.id)
                                    const isSelected = !!selected

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-orange-100 border border-orange-300' : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            onClick={() => toggleItem(item)}
                                        >
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-orange-600 border-orange-600' : 'border-gray-300'
                                                }`}>
                                                {isSelected && <Check className="h-3 w-3 text-white" />}
                                            </div>

                                            <div className="flex-1">
                                                <span className="font-mono text-sm font-medium">{item.code}</span>
                                                {item.weight && (
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        ({item.weight}kg)
                                                    </span>
                                                )}
                                            </div>

                                            {isSelected && !samePrice && (
                                                <input
                                                    type="number"
                                                    placeholder="Harga"
                                                    value={selected?.price || ''}
                                                    onChange={(e) => {
                                                        e.stopPropagation()
                                                        updateItemPrice(item.id, e.target.value)
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Buyer & Date */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pembeli</label>
                            <input
                                type="text"
                                placeholder="Nama pembeli"
                                value={buyerName}
                                onChange={(e) => setBuyerName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                            <input
                                type="date"
                                value={saleDate}
                                onChange={(e) => setSaleDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 rounded-b-xl">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-sm text-gray-600">Total ({selectedItems.length} ekor)</p>
                            <p className="text-2xl font-bold text-orange-600">{formatCurrency(total)}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || selectedItems.length === 0}
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : `Jual ${selectedItems.length} Ekor`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
