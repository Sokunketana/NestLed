import { request } from './http'

export type HouseholdRole = 'OWNER' | 'MEMBER'

export interface HouseholdMember {
  id: number
  email: string
  displayName?: string | null
  pictureUrl?: string | null
  role: HouseholdRole
}

export interface HouseholdInvitation {
  id: number
  email: string
  createdAt: string
}

export interface Household {
  id: number
  name: string
  currentUserRole: HouseholdRole
  members: HouseholdMember[]
  pendingInvitations: HouseholdInvitation[]
}

export const householdApi = {
  get: () => request<Household>('/household'),
  rename: (name: string) => request<Household>('/household', {
    method: 'PUT', body: JSON.stringify({ name }),
  }),
  invite: (email: string) => request<Household>('/household/invitations', {
    method: 'POST', body: JSON.stringify({ email }),
  }),
  cancelInvitation: (id: number) => request<Household>(`/household/invitations/${id}`, {
    method: 'DELETE',
  }),
  removeMember: (id: number) => request<Household>(`/household/members/${id}`, {
    method: 'DELETE',
  }),
}
