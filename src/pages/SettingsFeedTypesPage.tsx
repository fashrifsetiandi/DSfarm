import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Edit2, Trash2, AlertCircle, Package } from 'lucide-react'

interface FeedType {
    id: string
    feed_code?: string  // Alternative name in DB
    feed_type_code: string
    feed_name: string
    unit_of_measure: string
    description: string | null
    created_at: string
}

export function SettingsFeedTypesPage() {
    const { user } = useAuth()
    const [feedTypes, setFeedTypes] = useState<FeedType[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingFeed, setEditingFeed] = useState<FeedType | null>(null)
    const [formData, setFormData] = useState({
        feed_type_code: '',
        feed_name: '',
        unit_of_measure: 'kg',
        description: '',
    })
    const [error, setError] = useState('')

    useEffect(() => {
        if (user) {
            fetchFeedTypes()
        }
    }, [user])

    const fetchFeedTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('settings_feed_types')
                .select('*')
                .order('feed_name')

            if (error) throw error
            setFeedTypes((data || []) as unknown as FeedType[])
        } catch (err) {
            console.error('Error fetching feed types:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            if (editingFeed) {
                const { error } = await supabase
                    .from('settings_feed_types')
                    .update({
                        feed_type_code: formData.feed_type_code,
                        feed_name: formData.feed_name,
                        unit_of_measure: formData.unit_of_measure,
                        description: formData.description || null,
                    })
                    .eq('id', editingFeed.id)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('settings_feed_types')
                    .insert({
                        feed_code: formData.feed_type_code,
                        feed_name: formData.feed_name,
                        unit_of_measure: formData.unit_of_measure,
                        description: formData.description || null,
                        user_id: user?.id,
                    } as any)

                if (error) throw error
            }

            await fetchFeedTypes()
            resetForm()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleEdit = (feed: FeedType) => {
        setEditingFeed(feed)
        setFormData({
            feed_type_code: feed.feed_type_code,
            feed_name: feed.feed_name,
            unit_of_measure: feed.unit_of_measure,
            description: feed.description || '',
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus jenis pakan ini?')) return

        try {
            // Check if feed type is used in purchases
            const { count: purchaseCount } = await supabase
                .from('feed_purchases')
                .select('*', { count: 'exact', head: true })
                .eq('feed_type_id', id)

            if (purchaseCount && purchaseCount > 0) {
                alert(`Jenis pakan ini tidak dapat dihapus karena digunakan dalam ${purchaseCount} pembelian.`)
                return
            }

            // Check if feed type is used in usage records
            const { count: usageCount } = await supabase
                .from('feed_usage')
                .select('*', { count: 'exact', head: true })
                .eq('feed_type_id', id)

            if (usageCount && usageCount > 0) {
                alert(`Jenis pakan ini tidak dapat dihapus karena digunakan dalam ${usageCount} catatan pemakaian.`)
                return
            }

            const { error } = await supabase
                .from('settings_feed_types')
                .delete()
                .eq('id', id)

            if (error) throw error
            await fetchFeedTypes()
        } catch (err: any) {
            alert('Error: ' + err.message)
        }
    }

    const resetForm = () => {
        setFormData({
            feed_type_code: '',
            feed_name: '',
            unit_of_measure: 'kg',
            description: '',
        })
        setEditingFeed(null)
        setShowForm(false)
        setError('')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Jenis Pakan</h1>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">Kelola data jenis pakan kelinci</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white text-sm sm:text-base rounded-lg hover:bg-primary-700"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Tambah Jenis Pakan</span>
                    <span className="sm:hidden">Tambah</span>
                </button>
            </div>

            {/* Form Dialog */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">
                            {editingFeed ? 'Edit Jenis Pakan' : 'Tambah Jenis Pakan Baru'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kode Pakan *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={20}
                                    value={formData.feed_type_code}
                                    onChange={(e) =>
                                        setFormData({ ...formData, feed_type_code: e.target.value.toUpperCase() })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="PELET, HIJAUAN, KONSENTRAT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Pakan *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={100}
                                    value={formData.feed_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, feed_name: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Pelet Kelinci"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Satuan *
                                </label>
                                <select
                                    value={formData.unit_of_measure}
                                    onChange={(e) =>
                                        setFormData({ ...formData, unit_of_measure: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="kg">Kilogram (kg)</option>
                                    <option value="sak">Sak</option>
                                    <option value="karung">Karung</option>
                                    <option value="ikat">Ikat</option>
                                    <option value="unit">Unit</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deskripsi
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Deskripsi jenis pakan..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    {editingFeed ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {feedTypes.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Belum ada data jenis pakan</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Tambah jenis pakan pertama
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="sm:hidden divide-y divide-gray-200">
                            {feedTypes.map((feed) => (
                                <div key={feed.id} className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-mono font-semibold text-primary-600 text-sm">
                                                {feed.feed_type_code}
                                            </span>
                                            <p className="font-medium text-gray-900">{feed.feed_name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {feed.unit_of_measure}
                                            </span>
                                            <button
                                                onClick={() => handleEdit(feed)}
                                                className="text-blue-600 hover:text-blue-900 p-1"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(feed.id)}
                                                className="text-red-600 hover:text-red-900 p-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {feed.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2">{feed.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <table className="hidden sm:table w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kode
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nama Pakan
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Satuan
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Deskripsi
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {feedTypes.map((feed) => (
                                    <tr key={feed.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-mono font-semibold text-primary-600">
                                                {feed.feed_type_code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                                            {feed.feed_name}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {feed.unit_of_measure}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                            {feed.description || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(feed)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                <Edit2 className="h-4 w-4 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(feed.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="h-4 w-4 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    )
}
