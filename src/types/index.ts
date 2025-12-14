export interface Livestock {
    id: string
    user_id: string
    id_indukan: string
    breed_id: string
    gender: 'jantan' | 'betina'
    birth_date: string
    status: string
    mother_id?: string | null
    father_id?: string | null
    generation: number
    created_at: string
    updated_at: string
}

export interface Offspring {
    id: string
    user_id: string
    id_anakan: string
    mother_id: string
    father_id?: string | null
    birth_date: string
    status_farm: string
    weaning_date?: string | null
    ready_to_sell_date?: string | null
    created_at: string
    updated_at: string
}

export interface Breed {
    id: string
    user_id: string
    breed_code: string
    breed_name: string
    description?: string | null
    created_at: string
    updated_at: string
}

export interface Kandang {
    id: string
    user_id: string
    kandang_code: string
    name: string
    capacity: number
    current_occupancy: number
    created_at: string
    updated_at: string
}

export interface FinancialTransaction {
    id: string
    user_id: string
    transaction_code: string
    transaction_type: 'income' | 'expense'
    category_id: string
    amount: number
    transaction_date: string
    description?: string | null
    created_at: string
    updated_at: string
}
