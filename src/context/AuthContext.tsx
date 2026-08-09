import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '../types'
import { loadSession, loadUser, saveSession, saveUser, uid } from '../lib/storage'

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  updateProfile: (patch: Partial<Pick<User, 'name' | 'email' | 'avatarHue'>>) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function hashHue(email: string) {
  let h = 0
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) % 360
  return h
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => (loadSession() ? loadUser() : null))

  const login = useCallback(async (email: string, password: string) => {
    await wait(420)
    const existing = loadUser()
    if (!email.trim() || !password.trim()) {
      return { ok: false as const, error: 'Enter email and password.' }
    }
    if (password.length < 4) {
      return { ok: false as const, error: 'Password must be at least 4 characters.' }
    }
    if (existing && existing.email.toLowerCase() !== email.trim().toLowerCase()) {
      return { ok: false as const, error: 'No account for this email on this device.' }
    }
    const next =
      existing ??
      ({
        id: uid(),
        name: email.split('@')[0] || 'Friend',
        email: email.trim().toLowerCase(),
        avatarHue: hashHue(email),
        createdAt: new Date().toISOString(),
      } satisfies User)
    saveUser(next)
    saveSession(true)
    setUser(next)
    return { ok: true as const }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await wait(520)
    if (!name.trim()) return { ok: false as const, error: 'What should we call you?' }
    if (!email.includes('@')) return { ok: false as const, error: 'Enter a valid email.' }
    if (password.length < 4) {
      return { ok: false as const, error: 'Password must be at least 4 characters.' }
    }
    const next: User = {
      id: uid(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatarHue: hashHue(email),
      createdAt: new Date().toISOString(),
    }
    saveUser(next)
    saveSession(true)
    setUser(next)
    return { ok: true as const }
  }, [])

  const updateProfile = useCallback((patch: Partial<Pick<User, 'name' | 'email' | 'avatarHue'>>) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      saveUser(next)
      return next
    })
  }, [])

  const logout = useCallback(() => {
    saveSession(false)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      signup,
      updateProfile,
      logout,
    }),
    [user, login, signup, updateProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
