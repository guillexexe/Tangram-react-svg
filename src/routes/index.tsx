// src/routes/index.tsx
import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'

// Lazy-load tus páginas
const HomePage     = lazy(() => import('../pages/HomePage'))
const LoginPage    = lazy(() => import('../pages/LoginPage'))
const RegisterPage = lazy(() => import('../pages/RegisterPage'))
const StylesPanel  = lazy(() => import('../components/StylesPanel'))
const AdminPage    = lazy(() => import('../pages/AdminPage'))
const UserWizard   = lazy(() => import('../components/UserWizard'))

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loaded, init } = useUserStore()
  React.useEffect(() => { if (!loaded) init() }, [loaded, init])
  if (!loaded) return <div>Cargando usuario…</div>
  return user ? children : <Navigate to="/login" replace />
}

function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user } = useUserStore()
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<div>Cargando página…</div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/wizard"
          element={<UserWizard userId={useUserStore(s => s.user?.id!)} onClose={() => {}} />}
        />

        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <StylesPanel />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}