import type { Room } from '../types'
import { request } from './http'
export const roomApi = {
  list: () => request<Room[]>('/rooms'),
  get: (id: number) => request<Room>(`/rooms/${id}`),
  create: (body: { name: string; description?: string }) => request<Room>('/rooms', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: { name: string; description?: string }) => request<Room>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/rooms/${id}`, { method: 'DELETE' }),
}
