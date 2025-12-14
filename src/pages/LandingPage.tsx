import { Link } from 'react-router-dom'
import { Rabbit, TrendingUp, BarChart3, Shield, Smartphone, Users } from 'lucide-react'

export function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Rabbit className="h-8 w-8 text-primary-600" />
                        <span className="text-2xl font-bold text-primary-600">RUBY Farm</span>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            to="/login"
                            className="px-6 py-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Masuk
                        </Link>
                        <Link
                            to="/register"
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        >
                            Daftar Gratis
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Kelola Ternak Kelinci
                        <span className="block text-primary-600 mt-2">Lebih Mudah & Efisien</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Sistem manajemen farm kelinci terlengkap. Tracking silsilah otomatis,
                        laporan keuangan real-time, dan monitoring kesehatan dalam satu aplikasi.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            to="/register"
                            className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
                        >
                            Mulai Sekarang
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 bg-white border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-lg font-semibold"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center mb-12">Fitur Unggulan</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Users className="h-8 w-8" />}
                        title="Tracking Silsilah"
                        description="ID Anakan otomatis dengan format yang mencakup data ayah, ibu, dan tanggal lahir. Tracking hingga 5 generasi!"
                    />
                    <FeatureCard
                        icon={<TrendingUp className="h-8 w-8" />}
                        title="Deteksi Inbreeding"
                        description="Sistem otomatis mendeteksi kawin sedarah dengan perhitungan Wright's Coefficient untuk breeding yang sehat."
                    />
                    <FeatureCard
                        icon={<BarChart3 className="h-8 w-8" />}
                        title="Laporan Keuangan"
                        description="Tracking income & expense lengkap. Dashboard real-time dengan grafik pendapatan dan pengeluaran."
                    />
                    <FeatureCard
                        icon={<Rabbit className="h-8 w-8" />}
                        title="Manajemen Indukan & Anakan"
                        description="CRUD lengkap dengan auto-generation ID. Status otomatis berubah sesuai umur (anakan → pertumbuhan → siap jual)."
                    />
                    <FeatureCard
                        icon={<Shield className="h-8 w-8" />}
                        title="Data Aman & Private"
                        description="Row Level Security di semua tabel. Data Anda 100% aman dan hanya bisa diakses oleh Anda."
                    />
                    <FeatureCard
                        icon={<Smartphone className="h-8 w-8" />}
                        title="Progressive Web App"
                        description="Install sebagai aplikasi di HP atau desktop. Bekerja offline dengan sinkronisasi otomatis."
                    />
                </div>
            </section>

            {/* Stats */}
            <section className="bg-primary-600 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold mb-2">15+</div>
                            <div className="text-primary-100">Auto-Generation Triggers</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">13</div>
                            <div className="text-primary-100">Database Tables</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">100%</div>
                            <div className="text-primary-100">Gratis & Open Source</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto px-4 py-20 text-center">
                <div className="max-w-3xl mx-auto bg-gradient-to-r from-primary-500 to-green-600 rounded-2xl p-12 text-white shadow-2xl">
                    <h2 className="text-3xl font-bold mb-4">Siap Kelola Farm Kelinci Anda?</h2>
                    <p className="text-xl mb-8 text-primary-50">
                        Bergabung sekarang dan mulai tracking ternak kelinci Anda dengan lebih efisien.
                    </p>
                    <Link
                        to="/register"
                        className="inline-block px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold"
                    >
                        Daftar Gratis Sekarang
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Rabbit className="h-6 w-6 text-primary-500" />
                        <span className="text-xl font-bold text-white">RUBY Farm</span>
                    </div>
                    <p>© 2024 RUBY Farm. Sistem Manajemen Ternak Kelinci.</p>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-green-100">
            <div className="text-primary-600 mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    )
}
