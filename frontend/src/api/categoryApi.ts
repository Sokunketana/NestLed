import type { Category } from '../types'
import { request } from './http'
export const categoryApi = {
  list: () => request<Category[]>('/categories'),
  create: (body: { name: string; color: string }) => request<Category>('/categories', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: { name: string; color: string }) => request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
}
