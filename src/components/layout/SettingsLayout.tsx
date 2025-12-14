import { Link, Outlet, useLocation } from 'react-router-dom'
import { Settings, PackageOpen, DollarSign, Package } from 'lucide-react'

export function SettingsLayout() {
    const location = useLocation()

    const menuItems = [
        {
            path: '/settings/breeds',
            label: 'Ras Kelinci',
            icon: PackageOpen,
        },
        {
            path: '/settings/finance-categories',
            label: 'Kategori Keuangan',
            icon: DollarSign,
        },
        {
            path: '/settings/feed-types',
            label: 'Jenis Pakan',
            icon: Package,
        },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Settings className="h-8 w-8 text-primary-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
                    </div>
                    <p className="text-gray-600">Kelola data master untuk sistem RUBY Farm</p>
                </div>

                <div className="flex gap-6">
                    {/* Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        <nav className="bg-white rounded-lg shadow p-4 space-y-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon
                                const isActive = location.pathname === item.path
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                                ? 'bg-primary-50 text-primary-700 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    )
}
