import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Navbar } from './components/layout/Navbar'

// ============================================
// LAZY LOADING - PENJELASAN
// ============================================
// 
// SEBELUM (semua di-download sekaligus):
//   import { LivestockPage } from './pages/LivestockPage'
//   → User download 1 MB meskipun hanya buka landing page
//
// SESUDAH (download saat dibutuhkan):
//   const LivestockPage = lazy(() => import('./pages/LivestockPage'))
//   → User download ~400 KB awal, sisanya saat navigasi
//
// Ini seperti streaming Netflix: tidak download seluruh film, 
// tapi download bagian yang sedang ditonton saja.
// ============================================

import { lazy, Suspense } from 'react'

// Loading spinner component untuk Suspense
// Ditampilkan saat halaman sedang di-download
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Memuat halaman...</p>
    </div>
  </div>
)

// ============================================
// LAZY IMPORTS
// Setiap halaman sekarang menjadi "chunk" terpisah
// yang hanya di-download saat user navigasi ke sana
// 
// CATATAN: Karena halaman menggunakan "named export" 
// (export function X) bukan "default export" (export default X)
// kita perlu transformasi dengan .then()
// ============================================

// Auth pages - jarang diakses setelah login
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const AuthCallback = lazy(() => import('./pages/AuthCallback').then(m => ({ default: m.AuthCallback })))

// Main pages - ini yang besar, sangat worth it untuk lazy load
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const LivestockPage = lazy(() => import('./pages/LivestockPage').then(m => ({ default: m.LivestockPage })))
const OffspringPage = lazy(() => import('./pages/OffspringPage').then(m => ({ default: m.OffspringPage })))
const KandangPage = lazy(() => import('./pages/KandangPage').then(m => ({ default: m.KandangPage })))
const FinancePage = lazy(() => import('./pages/FinancePage').then(m => ({ default: m.FinancePage })))
const InventoryPage = lazy(() => import('./pages/InventoryPage').then(m => ({ default: m.InventoryPage })))

// Settings pages
const SettingsLayout = lazy(() => import('./components/layout/SettingsLayout').then(m => ({ default: m.SettingsLayout })))
const SettingsBreedsPage = lazy(() => import('./pages/SettingsBreedsPage').then(m => ({ default: m.SettingsBreedsPage })))
const SettingsFinanceCategoriesPage = lazy(() => import('./pages/SettingsFinanceCategoriesPage').then(m => ({ default: m.SettingsFinanceCategoriesPage })))
const SettingsFeedTypesPage = lazy(() => import('./pages/SettingsFeedTypesPage').then(m => ({ default: m.SettingsFeedTypesPage })))

// Configure React Query with smart caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data fresh for 5 minutes
      gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch when tab gains focus
      retry: 1, // Only retry once on failure
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {/* Suspense menangkap loading state dari lazy components */}
          {/* fallback = apa yang ditampilkan saat loading */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Dashboard Route */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <DashboardPage />
                    </>
                  </ProtectedRoute>
                }
              />

              {/* Settings Routes */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <SettingsLayout />
                    </>
                  </ProtectedRoute>
                }
              >
                <Route path="breeds" element={<SettingsBreedsPage />} />
                <Route path="finance-categories" element={<SettingsFinanceCategoriesPage />} />
                <Route path="feed-types" element={<SettingsFeedTypesPage />} />
              </Route>

              {/* Livestock Route */}
              <Route
                path="/livestock"
                element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <LivestockPage />
                    </>
                  </ProtectedRoute>
                }
              />

              {/* Offspring Route */}
              <Route
                path="/offspring"
                element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <OffspringPage />
                    </>
                  </ProtectedRoute>
                }
              />

              {/* Kandang Route */}
              <Route
                path="/kandang"
                element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <KandangPage />
                    </>
                  </ProtectedRoute>
                }
              />

              {/* Finance Route */}
              <Route
                path="/finance"
                element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <FinancePage />
                    </>
                  </ProtectedRoute>
                }
              />

              {/* Inventory Route */}
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <InventoryPage />
                    </>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App


