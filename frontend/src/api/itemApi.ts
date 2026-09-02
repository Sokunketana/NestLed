import type { BulkMoveItemsPayload, BulkMoveItemsResponse, Item, ItemPayload } from '../types'
import { request } from './http'

export const itemApi = {
  list: (filters?: { roomId?: string; categoryId?: string; storageLocationId?: string }) => {
    const query = new URLSearchParams()
    if (filters?.roomId) query.set('roomId', filters.roomId)
    if (filters?.categoryId) query.set('categoryId', filters.categoryId)
    if (filters?.storageLocationId) query.set('storageLocationId', filters.storageLocationId)
    return request<Item[]>(`/items${query.size ? `?${query}` : ''}`)
  },
  search: (name: string) => request<Item[]>(`/items/search?name=${encodeURIComponent(name)}`),
  get: (id: number) => request<Item>(`/items/${id}`),
  create: (body: ItemPayload, allowDuplicate = false) => request<Item>(
    `/items${allowDuplicate ? '?allowDuplicate=true' : ''}`,
    { method: 'POST', body: JSON.stringify(body) },
  ),
  update: (id: number, body: ItemPayload) => request<Item>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  bulkMove: (body: BulkMoveItemsPayload) => request<BulkMoveItemsResponse>('/items/bulk-move', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  uploadPhoto: (id: number, file: File) => {
    const body = new FormData()
    body.append('file', file)
    return request<Item>(`/items/${id}/photo`, { method: 'PUT', body })
  },
  removePhoto: (id: number) => request<void>(`/items/${id}/photo`, { method: 'DELETE' }),
  remove: (id: number) => request<void>(`/items/${id}`, { method: 'DELETE' }),
}
