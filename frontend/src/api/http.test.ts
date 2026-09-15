import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCsrfToken, request, resolvePhotoUrl } from './http'

describe('http client', () => {
  beforeEach(() => {
    clearCsrfToken()
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('loads CSRF details and sends the token with unsafe requests', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        headerName: 'X-XSRF-TOKEN',
        parameterName: '_csrf',
        token: 'csrf-token',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 7 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))

    await expect(request<{ id: number }>('/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'Passport' }),
    })).resolves.toEqual({ id: 7 })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:8080/api/auth/csrf')
    const requestInit = fetchMock.mock.calls[1]?.[1]
    expect(new Headers(requestInit?.headers).get('Content-Type')).toBe('application/json')
    expect(new Headers(requestInit?.headers).get('X-XSRF-TOKEN')).toBe('csrf-token')
    expect(requestInit?.credentials).toBe('include')
  })

  it('turns API validation errors into an ApiRequestError message', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      headerName: 'X-XSRF-TOKEN',
      parameterName: '_csrf',
      token: 'csrf-token',
    }), { status: 200 }))
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      message: 'Please correct the invalid fields',
      fieldErrors: { name: 'Name is required' },
    }), { status: 400 }))

    await expect(request('/items', { method: 'POST', body: '{}' }))
      .rejects.toMatchObject({ status: 400, message: 'Name is required' })
  })
})

describe('resolvePhotoUrl', () => {
  it('resolves relative backend media paths', () => {
    expect(resolvePhotoUrl('items/7/photo')).toBe('http://localhost:8080/api/items/7/photo')
  })

  it('rejects executable URL schemes', () => {
    expect(resolvePhotoUrl('javascript:alert(1)')).toBeUndefined()
  })
})
