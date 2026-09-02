import { backendUrl, clearCsrfToken, request } from './http'

export type AuthenticatedUser = {
  id: number
  email: string
  displayName?: string | null
  pictureUrl?: string | null
  householdId: number | null
  householdName: string | null
  householdRole: 'OWNER' | 'MEMBER' | null
  households: {
    id: number
    name: string
    role: 'OWNER' | 'MEMBER'
  }[]
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
  activateHousehold: (id: number) => request<AuthenticatedUser>(`/auth/households/${id}/activate`, {
    method: 'POST',
  }),
  logout: async () => {
    await request<void>('/auth/logout', { method: 'POST' })
    clearCsrfToken()
  },
}
