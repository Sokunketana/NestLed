import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi, type AuthenticatedUser } from '../api/authApi'
import { ApiRequestError } from '../api/http'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

type AuthContextValue = {
  status: AuthStatus
  user: AuthenticatedUser | null
  error: string | null
  login: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    authApi.me()
      .then(currentUser => {
        if (!active) return
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch(cause => {
        if (!active) return
        setUser(null)
        setStatus('anonymous')
        if (!(cause instanceof ApiRequestError && cause.status === 401)) {
          setError(cause instanceof Error ? cause.message : 'Could not contact the server')
        }
      })
    return () => { active = false }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    error,
    login: () => window.location.assign(authApi.loginUrl),
    logout: async () => {
      setError(null)
      try {
        await authApi.logout()
        setUser(null)
        setStatus('anonymous')
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not sign out')
      }
    },
  }), [error, status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
