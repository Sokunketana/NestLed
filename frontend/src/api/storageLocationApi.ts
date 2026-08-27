import type { StorageLocation } from '../types'
import { request } from './http'
export const storageLocationApi = {
  list: () => request<StorageLocation[]>('/storage-locations'),
  byRoom: (roomId: number) => request<StorageLocation[]>(`/rooms/${roomId}/storage-locations`),
  create: (body: { name: string; description?: string; roomId: number }) => request<StorageLocation>('/storage-locations', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: { name: string; description?: string; roomId: number }) => request<StorageLocation>(`/storage-locations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/storage-locations/${id}`, { method: 'DELETE' }),
}
