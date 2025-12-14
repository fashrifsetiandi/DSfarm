import { Link, Outlet, useLocation } from 'react-router-dom'
import { Settings, PackageOpen, DollarSign, Package } from 'lucide-react'

export function SettingsLayout() {
    const location = useLocation()

    const menuItems = [
        {
            path: '/settings/breeds',
            label: 'Ras Kelinci',
            shortLabel: 'Ras',
            icon: PackageOpen,
        },
        {
            path: '/settings/finance-categories',
            label: 'Kategori Keuangan',
            shortLabel: 'Keuangan',
            icon: DollarSign,
        },
        {
            path: '/settings/feed-types',
            label: 'Jenis Pakan',
            shortLabel: 'Pakan',
            icon: Package,
        },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
                {/* Header */}
                <div className="mb-4 sm:mb-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
                        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Pengaturan</h1>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600">Kelola data master untuk sistem RUBY Farm</p>
                </div>

                {/* Mobile: Horizontal Tabs */}
                <div className="sm:hidden mb-4">
                    <div className="bg-white rounded-lg shadow p-1 flex gap-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.path
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg transition-colors text-center ${isActive
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-xs font-medium">{item.shortLabel}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="flex gap-6">
                    {/* Desktop: Sidebar */}
                    <div className="hidden sm:block w-64 flex-shrink-0">
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
                    <div className="flex-1 min-w-0">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    )
}

