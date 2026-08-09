import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '../types'
import { api, getToken, setToken } from '../lib/api'

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  booting: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  updateProfile: (
    patch: Partial<Pick<User, 'name' | 'email' | 'avatarHue'>>,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const token = getToken()
      if (!token) {
        if (!cancelled) setBooting(false)
        return
      }
      try {
        const { user: me } = await api.me()
        if (!cancelled) setUser(me)
      } catch {
        setToken(null)
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setBooting(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { token, user: next } = await api.login(email, password)
      setToken(token)
      setUser(next)
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : 'Sign in failed.' }
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const { token, user: next } = await api.signup(name, email, password)
      setToken(token)
      setUser(next)
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : 'Sign up failed.' }
    }
  }, [])

  const updateProfile = useCallback(
    async (patch: Partial<Pick<User, 'name' | 'email' | 'avatarHue'>>) => {
      try {
        const { user: next } = await api.updateProfile(patch)
        setUser(next)
        return { ok: true as const }
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : 'Could not update profile.',
        }
      }
    },
    [],
  )

  const logout = useCallback(() => {
    const token = getToken()
    setToken(null)
    setUser(null)
    if (token) {
      void api.logout().catch(() => undefined)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      booting,
      login,
      signup,
      updateProfile,
      logout,
    }),
    [user, booting, login, signup, updateProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
