import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Rabbit, Mail, AlertCircle, CheckCircle } from 'lucide-react'

export function ForgotPasswordPage() {
    const { resetPassword } = useAuth()
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)
        setLoading(true)

        try {
            const { error } = await resetPassword(email)
            if (error) {
                setError(error.message)
            } else {
                setSuccess(true)
            }
        } catch (err) {
            setError('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-3xl font-bold text-primary-600">
                        <Rabbit className="h-10 w-10" />
                        RUBY Farm
                    </Link>
                    <p className="text-gray-600 mt-2">Reset password Anda</p>
                </div>

                {/* Reset Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Email Terkirim!</h2>
                            <p className="text-gray-600">
                                Kami telah mengirimkan link reset password ke <strong>{email}</strong>.
                                Silakan cek email Anda dan ikuti instruksi untuk reset password.
                            </p>
                            <Link
                                to="/login"
                                className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-semibold"
                            >
                                Kembali ke Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Lupa Password?</h2>
                                <p className="text-gray-600 text-sm">
                                    Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
                                </p>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="nama@email.com"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                            </button>

                            {/* Back to Login */}
                            <div className="text-center">
                                <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                    ← Kembali ke Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
