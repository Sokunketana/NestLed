import { download, request } from './http'

export const HOUSEHOLD_SUFFIX = "'s household"

export function householdNameWithSuffix(name: string) {
  const trimmedName = name.trim()
  if (!trimmedName || trimmedName.toLowerCase().endsWith(HOUSEHOLD_SUFFIX)) return trimmedName
  return `${trimmedName}${HOUSEHOLD_SUFFIX}`
}

export function editableHouseholdName(name: string) {
  const normalizedName = householdNameWithSuffix(name)
  return normalizedName.toLowerCase().endsWith(HOUSEHOLD_SUFFIX)
    ? normalizedName.slice(0, -HOUSEHOLD_SUFFIX.length).trimEnd()
    : normalizedName
}

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

export interface HouseholdExportPreview {
  format: 'json' | 'csv'
  householdName: string
  roomCount: number
  storageLocationCount: number
  categoryCount: number
  itemCount: number
  movementCount: number
  photoCount: number
  movementHistoryIncluded: boolean
}

export interface HouseholdImportIssue {
  path: string
  message: string
}

export interface HouseholdImportPreview {
  sourceHouseholdName: string | null
  sourceVersion: number
  destinationHouseholdName: string
  roomsToCreate: number
  existingRooms: number
  locationsToCreate: number
  existingLocations: number
  categoriesToCreate: number
  existingCategories: number
  itemsToImport: number
  duplicateItems: number
  movementRecordsSkipped: number
  errors: HouseholdImportIssue[]
  warnings: HouseholdImportIssue[]
  canImport: boolean
}

export interface HouseholdImportResult {
  sourceHouseholdName: string
  destinationHouseholdName: string
  roomsCreated: number
  locationsCreated: number
  categoriesCreated: number
  itemsImported: number
  duplicateItemsImported: number
  movementRecordsSkipped: number
}

function importFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

export const householdApi = {
  get: () => request<Household>('/household'),
  rename: (name: string) => request<Household>('/household', {
    method: 'PUT', body: JSON.stringify({ name: householdNameWithSuffix(name) }),
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
  leave: () => request<void>('/household/leave', {
    method: 'DELETE',
  }),
  exportPreview: (format: 'json' | 'csv') => request<HouseholdExportPreview>(`/household/export/preview?format=${format}`),
  exportData: (format: 'json' | 'csv') => download(`/household/export?format=${format}`),
  importPreview: (file: File) => request<HouseholdImportPreview>('/household/import/preview', {
    method: 'POST', body: importFile(file),
  }),
  importData: (file: File) => request<HouseholdImportResult>('/household/import', {
    method: 'POST', body: importFile(file),
  }),
}
