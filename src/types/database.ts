// Database types - will be generated from Supabase
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            user_profiles: {
                Row: {
                    id: string
                    user_id: string
                    full_name: string | null
                    email: string
                    phone: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    full_name?: string | null
                    email: string
                    phone?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    full_name?: string | null
                    email?: string
                    phone?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            settings_breeds: {
                Row: {
                    id: string
                    user_id: string
                    breed_code: string
                    breed_name: string
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    breed_code: string
                    breed_name: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    breed_code?: string
                    breed_name?: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            // Add more tables as needed...
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_ancestors: {
                Args: {
                    target_id: string
                    max_generations?: number
                }
                Returns: {
                    id: string
                    code: string
                    gender: string
                    generation: number
                    relationship: string
                    is_livestock: boolean
                }[]
            }
            calculate_inbreeding: {
                Args: {
                    father_id: string
                    mother_id: string
                }
                Returns: number
            }
            // Add more functions...
        }
        Enums: {
            gender_type: 'jantan' | 'betina'
            transaction_type: 'income' | 'expense'
            status_livestock: 'aktif' | 'bunting' | 'mati' | 'terjual' | 'afkir'
            status_farm: 'anakan' | 'pertumbuhan' | 'siap_jual' | 'mati' | 'terjual'
        }
    }
}
