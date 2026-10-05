import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import useSWR from 'swr'
import { authApi, type AuthenticatedUser } from '../api/authApi'
import { cacheKeys, clearUserScopedCache, revalidateInventory } from '../api/cache'
import { ApiRequestError } from '../api/http'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

type AuthContextValue = {
  status: AuthStatus
  backendReady: boolean
  user: AuthenticatedUser | null
  error: string | null
  login: () => void
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
  updateDisplayName: (displayName: string) => Promise<void>
  updateHouseholdName: (id: number, name: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, error: requestError, isLoading, mutate } = useSWR<AuthenticatedUser, ApiRequestError>(
    cacheKeys.authMe,
    authApi.me,
    {
      revalidateOnFocus: false,
      onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
        // A 401 confirms that the backend is ready for anonymous sign-in.
        if (error instanceof ApiRequestError && error.status === 401) return
        window.setTimeout(() => { void revalidate({ retryCount }) }, 3000)
      },
    },
  )
  const status: AuthStatus = isLoading ? 'loading' : user ? 'authenticated' : 'anonymous'
  const backendReady = !isLoading && (!requestError || (requestError instanceof ApiRequestError && requestError.status === 401))
  const error = requestError && !(requestError instanceof ApiRequestError && requestError.status === 401)
    ? requestError.message
    : null

  const value = useMemo<AuthContextValue>(() => ({
    status,
    backendReady,
    user: user ?? null,
    error,
    login: () => window.location.assign(authApi.loginUrl),
    deleteAccount: async () => {
      await authApi.deleteAccount()
      try {
        await authApi.logout()
      } finally {
        await clearUserScopedCache()
        await mutate(undefined, { revalidate: false })
      }
    },
    updateDisplayName: async (displayName: string) => {
      const updatedUser = await authApi.updateDisplayName(displayName)
      await mutate(updatedUser, { revalidate: false })
      void revalidateInventory({ household: true })
    },
    updateHouseholdName: (id: number, name: string) => {
      void mutate(currentUser => currentUser ? {
        ...currentUser,
        householdName: currentUser.householdId === id ? name : currentUser.householdName,
      } : currentUser, { revalidate: false })
    },
    logout: async () => {
      try {
        await authApi.logout()
        await clearUserScopedCache()
        await mutate(undefined, { revalidate: false })
      } catch (cause) {
        const logoutError = cause instanceof Error ? cause : new Error('Could not sign out')
        throw logoutError
      }
    },
  }), [backendReady, error, mutate, status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
