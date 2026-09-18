import { backendUrl, clearCsrfToken, request } from './http'

export type AuthenticatedUser = {
  id: number
  email: string
  displayName?: string | null
  pictureUrl?: string | null
  householdId: number | null
  householdName: string | null
  householdRole: 'OWNER' | 'MEMBER' | null
  onboardingCompleted: boolean
  pendingInvitations: {
    id: number
    householdId: number
    householdName: string
    createdAt: string
  }[]
}

export const authApi = {
  loginUrl: backendUrl('/oauth2/authorization/google'),
  me: () => request<AuthenticatedUser>('/auth/me'),
  deleteAccount: () => request<void>('/auth/account', { method: 'DELETE' }),
  completeOnboarding: () => request<void>('/auth/onboarding/complete', { method: 'POST' }),
  logout: async () => {
    await request<void>('/auth/logout', { method: 'POST' })
    clearCsrfToken()
  },
}
