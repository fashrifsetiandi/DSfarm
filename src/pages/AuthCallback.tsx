import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

/**
 * AuthCallback - Handle OAuth callback from Supabase
 * This page processes the OAuth tokens from the URL and redirects to dashboard
 */
export function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the session from URL (Supabase puts tokens in URL hash)
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('Auth callback error:', error)
                    navigate('/login', { replace: true })
                    return
                }

                if (session) {
                    // Successfully authenticated, go to dashboard
                    navigate('/dashboard', { replace: true })
                } else {
                    // No session, go back to login
                    navigate('/login', { replace: true })
                }
            } catch (err) {
                console.error('Auth callback exception:', err)
                navigate('/login', { replace: true })
            }
        }

        handleAuthCallback()
    }, [navigate])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memproses autentikasi...</p>
            </div>
        </div>
    )
}
