import type { ApiError } from '../types'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '')

function endpointUrl(path: string) {
  return `${API_URL}/${path.replace(/^\/+/, '')}`
}

/** Resolve backend-provided media paths without allowing executable URL schemes. */
export function resolvePhotoUrl(photoUrl?: string | null): string | undefined {
  const value = photoUrl?.trim()
  if (!value) return undefined

  try {
    const origin = typeof window === 'undefined' ? undefined : window.location.origin
    const apiBase = new URL(`${API_URL}/`, origin)
    const resolved = new URL(value, apiBase)
    return resolved.protocol === 'http:' || resolved.protocol === 'https:' ? resolved.href : undefined
  } catch {
    return undefined
  }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  if (typeof options?.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(endpointUrl(path), {
    ...options,
    headers,
  })
  if (!response.ok) {
    const error = (await response.json().catch(() => ({ message: 'Request failed' }))) as ApiError
    const validation = error.fieldErrors ? Object.values(error.fieldErrors).join(', ') : ''
    throw new Error(validation || error.message || 'Request failed')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
