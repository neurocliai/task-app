import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { AuthMode } from '../types'
import './Auth.css'

export function Auth() {
  const { isAuthenticated, login, signup } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const mode: AuthMode = params.get('mode') === 'login' ? 'login' : 'signup'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const title = useMemo(
    () => (mode === 'signup' ? 'Create your space' : 'Welcome back'),
    [mode],
  )

  if (isAuthenticated) return <Navigate to="/app" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result =
      mode === 'signup' ? await signup(name, email, password) : await login(email, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/app')
  }

  function switchMode(next: AuthMode) {
    setError('')
    setParams({ mode: next })
  }

  return (
    <main className="page no-nav auth-page">
      <Link to="/" className="back-link" aria-label="Back to landing">
        <ArrowLeft size={18} />
        Lumen
      </Link>

      <motion.div
        className="auth-panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow">{mode === 'signup' ? 'New account' : 'Sign in'}</p>
        <h1 className="h2">{title}</h1>
        <p className="lead auth-lead">
          {mode === 'signup'
            ? 'Takes under a minute. Your tasks stay on this device.'
            : 'Pick up where you left off — same device, same flow.'}
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.div
                key="name"
                className="field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  autoComplete="name"
                  placeholder="Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="At least 4 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : null}
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'signup' ? (
            <>
              Already here?{' '}
              <button type="button" onClick={() => switchMode('login')}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Lumen?{' '}
              <button type="button" onClick={() => switchMode('signup')}>
                Create account
              </button>
            </>
          )}
        </p>
      </motion.div>
    </main>
  )
}
