import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronRight, User } from 'lucide-react'

interface TreeNode {
    id: string
    code: string
    gender: string | null
    generation: number | null
    birth_date?: string
    type: 'livestock' | 'offspring'
}

interface GenerationTreeProps {
    // Either livestock or offspring
    livestockId?: string
    offspringId?: string
    motherId?: string | null
    fatherId?: string | null
    generation: number
}

export function GenerationTree({ livestockId, motherId, fatherId, generation }: GenerationTreeProps) {
    const [ancestors, setAncestors] = useState<{ mother: TreeNode | null; father: TreeNode | null }>({
        mother: null,
        father: null,
    })
    const [grandparents, setGrandparents] = useState<{
        maternalMother: TreeNode | null
        maternalFather: TreeNode | null
        paternalMother: TreeNode | null
        paternalFather: TreeNode | null
    }>({
        maternalMother: null,
        maternalFather: null,
        paternalMother: null,
        paternalFather: null,
    })
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(true)

    useEffect(() => {
        fetchAncestors()
    }, [motherId, fatherId])

    const fetchAncestors = async () => {
        try {
            // Fetch parents
            if (motherId) {
                const { data: mother } = await supabase
                    .from('livestock')
                    .select('id, id_indukan, gender, generation, birth_date, mother_id, father_id')
                    .eq('id', motherId)
                    .single() as { data: any }

                if (mother) {
                    setAncestors(prev => ({
                        ...prev,
                        mother: {
                            id: mother.id,
                            code: mother.id_indukan,
                            gender: mother.gender,
                            generation: mother.generation,
                            birth_date: mother.birth_date,
                            type: 'livestock',
                        },
                    }))

                    // Fetch maternal grandparents
                    if (mother.mother_id) {
                        const { data: maternalMother } = await supabase
                            .from('livestock')
                            .select('id, id_indukan, gender, generation')
                            .eq('id', mother.mother_id)
                            .single() as { data: any }
                        if (maternalMother) {
                            setGrandparents(prev => ({
                                ...prev,
                                maternalMother: {
                                    id: maternalMother.id,
                                    code: maternalMother.id_indukan,
                                    gender: maternalMother.gender,
                                    generation: maternalMother.generation,
                                    type: 'livestock',
                                },
                            }))
                        }
                    }
                    if (mother.father_id) {
                        const { data: maternalFather } = await supabase
                            .from('livestock')
                            .select('id, id_indukan, gender, generation')
                            .eq('id', mother.father_id)
                            .single() as { data: any }
                        if (maternalFather) {
                            setGrandparents(prev => ({
                                ...prev,
                                maternalFather: {
                                    id: maternalFather.id,
                                    code: maternalFather.id_indukan,
                                    gender: maternalFather.gender,
                                    generation: maternalFather.generation,
                                    type: 'livestock',
                                },
                            }))
                        }
                    }
                }
            }

            if (fatherId) {
                const { data: father } = await supabase
                    .from('livestock')
                    .select('id, id_indukan, gender, generation, birth_date, mother_id, father_id')
                    .eq('id', fatherId)
                    .single()

                if (father) {
                    setAncestors(prev => ({
                        ...prev,
                        father: {
                            id: father.id,
                            code: father.id_indukan,
                            gender: father.gender,
                            generation: father.generation,
                            birth_date: father.birth_date,
                            type: 'livestock',
                        },
                    }))

                    // Fetch paternal grandparents
                    if (father.mother_id) {
                        const { data: paternalMother } = await supabase
                            .from('livestock')
                            .select('id, id_indukan, gender, generation')
                            .eq('id', father.mother_id)
                            .single()
                        if (paternalMother) {
                            setGrandparents(prev => ({
                                ...prev,
                                paternalMother: {
                                    id: paternalMother.id,
                                    code: paternalMother.id_indukan,
                                    gender: paternalMother.gender,
                                    generation: paternalMother.generation,
                                    type: 'livestock',
                                },
                            }))
                        }
                    }
                    if (father.father_id) {
                        const { data: paternalFather } = await supabase
                            .from('livestock')
                            .select('id, id_indukan, gender, generation')
                            .eq('id', father.father_id)
                            .single()
                        if (paternalFather) {
                            setGrandparents(prev => ({
                                ...prev,
                                paternalFather: {
                                    id: paternalFather.id,
                                    code: paternalFather.id_indukan,
                                    gender: paternalFather.gender,
                                    generation: paternalFather.generation,
                                    type: 'livestock',
                                },
                            }))
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching ancestors:', err)
        } finally {
            setLoading(false)
        }
    }

    const NodeCard = ({ node, label }: { node: TreeNode | null; label: string }) => {
        if (!node) {
            return (
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center min-w-[100px]">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm text-gray-400">-</p>
                </div>
            )
        }

        const genderColor = node.gender === 'jantan' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-pink-600 bg-pink-50 border-pink-200'
        const genderIcon = node.gender === 'jantan' ? '♂' : '♀'

        return (
            <div className={`rounded-lg p-2 text-center min-w-[100px] border ${genderColor}`}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-semibold flex items-center justify-center gap-1">
                    <span>{genderIcon}</span>
                    {node.code}
                </p>
                <p className="text-xs text-gray-500">Gen {node.generation}</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    const hasAncestors = ancestors.mother || ancestors.father
    const hasGrandparents = grandparents.maternalMother || grandparents.maternalFather ||
        grandparents.paternalMother || grandparents.paternalFather

    if (!hasAncestors) {
        return (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
                <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Tidak ada data silsilah</p>
                <p className="text-gray-400 text-xs mt-1">Ternak ini adalah generasi pertama (dari pembelian)</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                🌳 Silsilah Keluarga (Generasi {generation})
            </button>

            {expanded && (
                <div className="bg-gradient-to-b from-white to-gray-50 rounded-lg p-4 border">
                    {/* Current Subject */}
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary-100 border-2 border-primary-500 rounded-lg p-3 text-center">
                            <p className="text-xs text-primary-600">Subjek</p>
                            <p className="font-bold text-primary-700">
                                {livestockId ? 'Indukan Ini' : 'Anakan Ini'}
                            </p>
                            <p className="text-xs text-primary-500">Gen {generation}</p>
                        </div>
                    </div>

                    {/* Connecting Line */}
                    <div className="flex justify-center">
                        <div className="w-0.5 h-4 bg-gray-300"></div>
                    </div>

                    {/* Parents Row */}
                    <div className="flex justify-center gap-8 mb-4">
                        <div className="flex flex-col items-center">
                            <NodeCard node={ancestors.mother} label="Induk Betina" />

                            {/* Grandparents under Mother */}
                            {hasGrandparents && (grandparents.maternalMother || grandparents.maternalFather) && (
                                <>
                                    <div className="w-0.5 h-3 bg-gray-200"></div>
                                    <div className="flex gap-2">
                                        <NodeCard node={grandparents.maternalFather} label="Kakek" />
                                        <NodeCard node={grandparents.maternalMother} label="Nenek" />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col items-center">
                            <NodeCard node={ancestors.father} label="Induk Jantan" />

                            {/* Grandparents under Father */}
                            {hasGrandparents && (grandparents.paternalMother || grandparents.paternalFather) && (
                                <>
                                    <div className="w-0.5 h-3 bg-gray-200"></div>
                                    <div className="flex gap-2">
                                        <NodeCard node={grandparents.paternalFather} label="Kakek" />
                                        <NodeCard node={grandparents.paternalMother} label="Nenek" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
