import { backendUrl, clearCsrfToken, request } from './http'

export type AuthenticatedUser = {
  id: number
  email: string
  displayName?: string | null
  pictureUrl?: string | null
}

export const authApi = {
  loginUrl: backendUrl('/oauth2/authorization/google'),
  me: () => request<AuthenticatedUser>('/auth/me'),
  logout: async () => {
    await request<void>('/auth/logout', { method: 'POST' })
    clearCsrfToken()
  },
}
