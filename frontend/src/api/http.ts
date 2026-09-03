import type { ApiError } from '../types'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '')
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || API_URL.replace(/\/api$/, '')).replace(/\/+$/, '')

type CsrfDetails = {
  headerName: string
  parameterName: string
  token: string
}

let csrfDetails: CsrfDetails | null = null
let csrfRequest: Promise<CsrfDetails> | null = null

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number, readonly response?: ApiError) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

function endpointUrl(path: string) {
  return `${API_URL}/${path.replace(/^\/+/, '')}`
}

export function backendUrl(path: string) {
  return `${BACKEND_URL}/${path.replace(/^\/+/, '')}`
}

async function csrfToken() {
  if (csrfDetails) return csrfDetails
  if (!csrfRequest) {
    csrfRequest = fetch(endpointUrl('/auth/csrf'), { credentials: 'include' })
      .then(async response => {
        if (!response.ok) throw new ApiRequestError('Could not initialize request security', response.status)
        return response.json() as Promise<CsrfDetails>
      })
  }
  try {
    csrfDetails = await csrfRequest
    return csrfDetails
  } finally {
    csrfRequest = null
  }
}

export function clearCsrfToken() {
  csrfDetails = null
  csrfRequest = null
}

async function fetchWithSafeRetry(url: string, init: RequestInit, method: string) {
  const retryable = ['GET', 'HEAD', 'OPTIONS'].includes(method)
  const maxAttempts = retryable ? 3 : 1
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, init)
      if (response.ok || !retryable || ![502, 503, 504].includes(response.status) || attempt === maxAttempts - 1) {
        return response
      }
    } catch (cause) {
      lastError = cause
      if (!retryable || attempt === maxAttempts - 1) throw cause
    }

    await new Promise(resolve => window.setTimeout(resolve, 400 * (attempt + 1)))
  }

  throw lastError instanceof Error ? lastError : new Error('Could not contact the server')
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
  const method = (options?.method || 'GET').toUpperCase()
  if (typeof options?.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = await csrfToken()
    headers.set(csrf.headerName, csrf.token)
  }

  const response = await fetchWithSafeRetry(endpointUrl(path), {
    ...options,
    headers,
    credentials: 'include',
  }, method)
  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      message: `Request failed (${response.status}${response.statusText ? ` ${response.statusText}` : ''})`,
    }))) as ApiError
    const validation = error.fieldErrors ? Object.values(error.fieldErrors).join(', ') : ''
    throw new ApiRequestError(validation || error.message || 'Request failed', response.status, error)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
