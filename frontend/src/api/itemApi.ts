import type { Item, ItemPayload } from '../types'
import { request } from './http'

export const itemApi = {
  list: (filters?: { roomId?: string; categoryId?: string }) => {
    const query = new URLSearchParams()
    if (filters?.roomId) query.set('roomId', filters.roomId)
    if (filters?.categoryId) query.set('categoryId', filters.categoryId)
    return request<Item[]>(`/items${query.size ? `?${query}` : ''}`)
  },
  search: (name: string) => request<Item[]>(`/items/search?name=${encodeURIComponent(name)}`),
  get: (id: number) => request<Item>(`/items/${id}`),
  create: (body: ItemPayload) => request<Item>('/items', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: ItemPayload) => request<Item>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/items/${id}`, { method: 'DELETE' }),
}
