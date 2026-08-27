import type { ApiError } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!response.ok) {
    const error = (await response.json().catch(() => ({ message: 'Request failed' }))) as ApiError
    const validation = error.fieldErrors ? Object.values(error.fieldErrors).join(', ') : ''
    throw new Error(validation || error.message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
