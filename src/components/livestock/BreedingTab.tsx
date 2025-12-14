import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, TrendingUp, Heart, AlertCircle, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { BreedingRecordForm } from './BreedingRecordForm'


interface Birth {
    id: string
    birth_code: string
    mother_id: string
    father_id: string | null
    mating_date: string | null
    palpation_date: string | null
    palpation_result: boolean
    birth_date: string
    total_born: number
    total_alive: number
    male_count: number
    female_count: number
    weaned_count: number
    male_weaned: number
    female_weaned: number
    weaning_success_rate: number | null
    notes: string | null
    father_livestock?: {
        id_indukan: string
    }
}

interface BreedingTabProps {
    livestockId: string
    livestockCode: string
    birthDate: string  // Birth date of mother for minimum mating date validation
}

export function BreedingTab({ livestockId, birthDate }: BreedingTabProps) {
    const [births, setBirths] = useState<Birth[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingBirth, setEditingBirth] = useState<Birth | null>(null)

    useEffect(() => {
        fetchBreedingRecords()
    }, [livestockId])

    const fetchBreedingRecords = async () => {
        try {
            const { data, error } = await supabase
                .from('births')
                .select(`
    *,
    father_livestock:livestock!births_father_id_fkey(
        id_indukan
    )
                `)
                .eq('mother_id', livestockId)
                .order('birth_date', { ascending: false })

            if (error) throw error
            setBirths((data || []) as unknown as Birth[])
        } catch (err) {
            console.error('Error fetching breeding records:', err)
        } finally {
            setLoading(false)
        }
    }

    // Calculate statistics
    const stats = {
        totalBreeding: births.length,
        success: births.reduce((sum, b) => sum + (b.weaned_count || 0), 0), // Total ekor yang berhasil disapih
        failed: births.filter(b => b.total_alive === 0).length,
        survivalRate: births.length > 0
            ? ((births.reduce((sum, b) => sum + (b.weaning_success_rate || 0), 0) / births.length) || 0).toFixed(1)
            : '0.0'
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus catatan breeding ini? Data anakan terkait juga akan dihapus.')) return

        try {
            // First, delete related offspring records
            const { error: offspringError } = await supabase
                .from('offspring')
                .delete()
                .eq('birth_id', id)

            if (offspringError) throw offspringError

            // Then delete the birth record
            const { error: birthError } = await supabase
                .from('births')
                .delete()
                .eq('id', id)

            if (birthError) throw birthError

            await fetchBreedingRecords()
        } catch (err: any) {
            alert('Error: ' + err.message)
        }
    }

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading...</div>
    }

    return (
        <div className="p-6 space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Heart className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Total Breeding</p>
                            <p className="text-2xl font-bold text-blue-700">{stats.totalBreeding}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-sm text-green-600 font-medium">Berhasil Sapih</p>
                            <p className="text-2xl font-bold text-green-700">{stats.success}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                        <div>
                            <p className="text-sm text-red-600 font-medium">Gagal</p>
                            <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Heart className="h-8 w-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Tingkat Survive</p>
                            <p className="text-2xl font-bold text-purple-700">{stats.survivalRate}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Catatan Breeding
                </button>
            </div>

            {/* Breeding Records Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kapan Kawin</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pejantan</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Palpasi</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lahir</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Lahir</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sapih</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Sapih</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {births.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        Belum ada catatan breeding
                                    </td>
                                </tr>
                            ) : (
                                births.map((birth) => (
                                    <tr key={birth.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {birth.mating_date ? format(new Date(birth.mating_date), 'dd MMM yyyy') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                            {birth.father_livestock?.id_indukan || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {birth.palpation_date ? (
                                                <div>
                                                    <p className="text-gray-900">{format(new Date(birth.palpation_date), 'dd MMM yyyy')}</p>
                                                    <span className={`text - xs ${birth.palpation_result ? 'text-green-600' : 'text-red-600'} `}>
                                                        {birth.palpation_result ? '✓ Positif' : '✗ Negatif'}
                                                    </span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {format(new Date(birth.birth_date), 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div>
                                                <p className="text-gray-900 font-medium">{birth.total_born}</p>
                                                <p className="text-xs text-gray-500">
                                                    ♂{birth.male_count} ♀{birth.female_count}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div>
                                                <p className="text-gray-900 font-medium">{birth.weaned_count}</p>
                                                <p className="text-xs text-gray-500">
                                                    ♂{birth.male_weaned || 0} ♀{birth.female_weaned || 0}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {birth.weaning_success_rate !== null ? (
                                                <span className={`font - medium ${(birth.weaning_success_rate || 0) >= 80 ? 'text-green-600' :
                                                    (birth.weaning_success_rate || 0) >= 50 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    } `}>
                                                    {birth.weaning_success_rate.toFixed(1)}%
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Hide edit button if weaning data is complete (offspring auto-created) */}
                                                {!(birth.male_weaned > 0 || birth.female_weaned > 0) && (
                                                    <button
                                                        onClick={() => setEditingBirth(birth)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(birth.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Form Modal */}
            {(showAddForm || editingBirth) && (
                <BreedingRecordForm
                    livestockId={livestockId}
                    motherBirthDate={birthDate}
                    mode={editingBirth ? 'edit' : 'create'}
                    initialData={editingBirth}
                    onClose={() => {
                        setShowAddForm(false)
                        setEditingBirth(null)
                    }}
                    onSuccess={() => {
                        fetchBreedingRecords()
                        setShowAddForm(false)
                        setEditingBirth(null)
                    }}
                />
            )}
        </div>
    )
}
