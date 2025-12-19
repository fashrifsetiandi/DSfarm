import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertCircle } from 'lucide-react'
import { useIsOnline } from '@/hooks/useOnlineStatus'

interface KandangFormData {
    block: string
    quantity: string
    location: string
    capacity: string
    description: string
}

export function KandangAddForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth()
    const isOnline = useIsOnline()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState<KandangFormData>({
        block: '',
        quantity: '1',
        location: '',
        capacity: '1',
        description: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.block.trim()) {
            setError('Blok kandang harus diisi')
            return
        }

        setLoading(true)

        try {
            const quantity = parseInt(formData.quantity)
            const capacity = parseInt(formData.capacity)
            const block = formData.block.trim().toUpperCase()

            // Check if online
            if (!isOnline) {
                // Offline: Queue with temporary codes
                const { addToQueue } = await import('@/lib/dexie')
                const timestamp = Date.now()

                for (let i = 0; i < quantity; i++) {
                    const tempCode = `${block}-TMP${timestamp + i}`
                    await addToQueue('kandang', 'insert', {
                        kandang_code: tempCode,
                        name: `Kandang ${block}-${String(i + 1).padStart(2, '0')}`,
                        location: formData.location || null,
                        capacity: capacity,
                        description: formData.description || null,
                        user_id: user?.id,
                        _needsCodeGeneration: true, // Flag for sync to regenerate code
                        _block: block,
                    })
                }

                // Show toast and close form
                const { toast } = await import('sonner')
                toast.info('📥 Data disimpan offline', {
                    description: `${quantity} kandang akan sync saat koneksi tersedia`
                })
                onSuccess()
                onClose()
                return
            }

            // Online: Fetch existing kandang codes with same block prefix to find the last number
            const { data: existingKandangs } = await supabase
                .from('kandang')
                .select('kandang_code')
                .like('kandang_code', `${block}-%`)
                .order('kandang_code', { ascending: false })

            // Find the highest number for this block
            let startNumber = 1
            if (existingKandangs && existingKandangs.length > 0) {
                const lastCode = existingKandangs[0].kandang_code
                const numberMatch = lastCode.match(/-(\d+)$/)
                if (numberMatch) {
                    startNumber = parseInt(numberMatch[1]) + 1
                }
            }

            // Create array of kandang to insert with continued numbering
            const kandangPayloads = []
            for (let i = 0; i < quantity; i++) {
                const num = startNumber + i
                const code = `${block}-${String(num).padStart(2, '0')}`
                kandangPayloads.push({
                    kandang_code: code,
                    name: `Kandang ${code}`,
                    location: formData.location || null,
                    capacity: capacity,
                    description: formData.description || null,
                    user_id: user?.id,
                })
            }

            const { error } = await supabase.from('kandang').insert(kandangPayloads as any)

            if (error) throw error

            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const previewCodes = () => {
        const block = formData.block.trim().toUpperCase() || 'X'
        const qty = parseInt(formData.quantity) || 1
        if (qty === 1) {
            return `${block}-01`
        }
        return `${block}-01 sampai ${block}-${String(qty).padStart(2, '0')} (${qty} kandang)`
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold">Tambah Kandang Baru</h2>
                        <p className="text-sm text-gray-600 mt-1">Buat beberapa kandang sekaligus</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Blok Kandang <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="block"
                                    required
                                    maxLength={10}
                                    value={formData.block}
                                    onChange={handleChange}
                                    placeholder="A, B, C, Indoor..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jumlah Kandang <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    required
                                    min="1"
                                    max="50"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 -mt-2">
                            Akan dibuat: <span className="font-medium text-primary-600">{previewCodes()}</span>
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kapasitas/Kandang <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="capacity"
                                    required
                                    min="1"
                                    max="100"
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    placeholder="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Maks kelinci per kandang</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                                <input
                                    type="text"
                                    name="location"
                                    maxLength={100}
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Depan, Belakang"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                            <textarea
                                name="description"
                                rows={2}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Deskripsi tambahan..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            Kode kandang menggunakan format: <strong>[Blok]-[Nomor]</strong>
                            <br />
                            Contoh: A-01, B-02, Indoor-03
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.block.trim()}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : `Buat ${formData.quantity} Kandang`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
