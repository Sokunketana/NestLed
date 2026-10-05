import { afterEach, expect, it, vi } from 'vitest'
import { authApi } from './authApi'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('aborts a stalled session request without retrying the aborted signal', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  }))
  vi.stubGlobal('fetch', fetchMock)
  const result = expect(authApi.me()).rejects.toMatchObject({ name: 'AbortError' })
  await vi.advanceTimersByTimeAsync(10000)
  await result
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(vi.getTimerCount()).toBe(0)
})

it('clears the session timeout after a successful response', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200 })))
  await expect(authApi.me()).resolves.toEqual({ id: 1 })
  expect(vi.getTimerCount()).toBe(0)
})
