import { request } from './http'
import type { AuthenticatedUser } from './authApi'

export const invitationApi = {
  accept: (id: number) => request<AuthenticatedUser>(`/invitations/${id}/accept`, { method: 'POST' }),
  reject: (id: number) => request<AuthenticatedUser>(`/invitations/${id}`, { method: 'DELETE' }),
}
