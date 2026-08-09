import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { useAuth } from './context/AuthContext'
import { Auth } from './pages/Auth'
import { Landing } from './pages/Landing'
import { Profile } from './pages/Profile'
import { Tasks } from './pages/Tasks'
import type { ReactNode } from 'react'

function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated, booting } = useAuth()
  if (booting) {
    return (
      <main className="page no-nav" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p className="lead">Loading your space…</p>
      </main>
    )
  }
  if (!isAuthenticated) return <Navigate to="/auth?mode=login" replace />
  return children
}

export default function App() {
  return (
    <div className="app-root">
      <div className="phone-shell">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/app"
            element={
              <Protected>
                <AppLayout />
              </Protected>
            }
          >
            <Route index element={<Tasks />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
