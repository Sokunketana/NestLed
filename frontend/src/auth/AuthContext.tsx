import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import useSWR from 'swr'
import { authApi, type AuthenticatedUser } from '../api/authApi'
import { cacheKeys } from '../api/cache'
import { ApiRequestError } from '../api/http'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

type AuthContextValue = {
  status: AuthStatus
  user: AuthenticatedUser | null
  error: string | null
  login: () => void
  logout: () => Promise<void>
  updateHouseholdName: (id: number, name: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, error: requestError, isLoading, mutate } = useSWR<AuthenticatedUser, ApiRequestError>(
    cacheKeys.authMe,
    authApi.me,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const status: AuthStatus = isLoading ? 'loading' : user ? 'authenticated' : 'anonymous'
  const error = requestError && !(requestError instanceof ApiRequestError && requestError.status === 401)
    ? requestError.message
    : null

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user: user ?? null,
    error,
    login: () => window.location.assign(authApi.loginUrl),
    updateHouseholdName: (id: number, name: string) => {
      void mutate(currentUser => currentUser ? {
        ...currentUser,
        householdName: currentUser.householdId === id ? name : currentUser.householdName,
      } : currentUser, { revalidate: false })
    },
    logout: async () => {
      try {
        await authApi.logout()
        await mutate(undefined, { revalidate: false })
      } catch (cause) {
        const logoutError = cause instanceof Error ? cause : new Error('Could not sign out')
        throw logoutError
      }
    },
  }), [error, mutate, status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
