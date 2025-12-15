import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'

interface Breed {
    id: string
    breed_code: string
    breed_name: string
    description: string | null
    created_at: string | null  // Allow null
}

export function SettingsBreedsPage() {
    const { user } = useAuth()
    const [breeds, setBreeds] = useState<Breed[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingBreed, setEditingBreed] = useState<Breed | null>(null)
    const [formData, setFormData] = useState({
        breed_code: '',
        breed_name: '',
        description: '',
    })
    const [error, setError] = useState('')

    useEffect(() => {
        if (user) {
            fetchBreeds()
        }
    }, [user])

    const fetchBreeds = async () => {
        try {
            const { data, error } = await supabase
                .from('settings_breeds')
                .select('*')
                .order('breed_name')

            if (error) throw error
            setBreeds((data || []) as Breed[])
        } catch (err) {
            console.error('Error fetching breeds:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            if (editingBreed) {
                // Update
                const { error } = await supabase
                    .from('settings_breeds')
                    .update({
                        breed_code: formData.breed_code,
                        breed_name: formData.breed_name,
                        description: formData.description || null,
                    })
                    .eq('id', editingBreed.id)

                if (error) throw error
            } else {
                // Insert
                const { error } = await supabase
                    .from('settings_breeds')
                    .insert({
                        breed_code: formData.breed_code,
                        breed_name: formData.breed_name,
                        description: formData.description || null,
                        user_id: user?.id,
                    } as any)

                if (error) throw error
            }

            await fetchBreeds()
            resetForm()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleEdit = (breed: Breed) => {
        setEditingBreed(breed)
        setFormData({
            breed_code: breed.breed_code,
            breed_name: breed.breed_name,
            description: breed.description || '',
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus ras ini?')) return

        try {
            // Check if breed is used by any livestock
            const { count } = await supabase
                .from('livestock')
                .select('*', { count: 'exact', head: true })
                .eq('breed_id', id)

            if (count && count > 0) {
                alert(`Ras ini tidak dapat dihapus karena sedang digunakan oleh ${count} ternak.`)
                return
            }

            const { error } = await supabase
                .from('settings_breeds')
                .delete()
                .eq('id', id)

            if (error) throw error
            await fetchBreeds()
        } catch (err: any) {
            alert('Error: ' + err.message)
        }
    }

    const resetForm = () => {
        setFormData({ breed_code: '', breed_name: '', description: '' })
        setEditingBreed(null)
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
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Ras Kelinci</h1>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">Kelola data ras kelinci</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white text-sm sm:text-base rounded-lg hover:bg-primary-700"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Tambah Ras</span>
                    <span className="sm:hidden">Tambah</span>
                </button>
            </div>

            {/* Form Dialog */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">
                            {editingBreed ? 'Edit Ras' : 'Tambah Ras Baru'}
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
                                    Kode Ras *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={10}
                                    value={formData.breed_code}
                                    onChange={(e) =>
                                        setFormData({ ...formData, breed_code: e.target.value.toUpperCase() })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="NZW, REX, CAL"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Ras *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={100}
                                    value={formData.breed_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, breed_name: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="New Zealand White"
                                />
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
                                    placeholder="Deskripsi singkat tentang ras ini..."
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
                                    {editingBreed ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {breeds.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">Belum ada data ras kelinci</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Tambah ras pertama
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="sm:hidden divide-y divide-gray-200">
                            {breeds.map((breed) => (
                                <div key={breed.id} className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-mono font-semibold text-primary-600 text-sm">
                                                {breed.breed_code}
                                            </span>
                                            <p className="font-medium text-gray-900">{breed.breed_name}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleEdit(breed)}
                                                className="text-blue-600 hover:text-blue-900 p-1"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(breed.id)}
                                                className="text-red-600 hover:text-red-900 p-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {breed.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2">{breed.description}</p>
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
                                        Nama Ras
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
                                {breeds.map((breed) => (
                                    <tr key={breed.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-mono font-semibold text-primary-600">
                                                {breed.breed_code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                                            {breed.breed_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                            {breed.description || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(breed)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                <Edit2 className="h-4 w-4 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(breed.id)}
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
