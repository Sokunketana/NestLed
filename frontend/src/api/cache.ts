import { mutate } from 'swr'

export const cacheKeys = {
  authMe: '/auth/me',
  dashboard: '/dashboard',
  household: '/household',
  rooms: '/rooms',
  locations: '/storage-locations',
  categories: '/categories',
  movements: '/item-movements',
  item: (id: number) => `/items/${id}`,
  itemList: (filters?: { roomId?: string; categoryId?: string; storageLocationId?: string }) => {
    const query = new URLSearchParams()
    if (filters?.roomId) query.set('roomId', filters.roomId)
    if (filters?.categoryId) query.set('categoryId', filters.categoryId)
    if (filters?.storageLocationId) query.set('storageLocationId', filters.storageLocationId)
    return `/items${query.size ? `?${query}` : ''}`
  },
  itemSearch: (name: string) => `/items/search?name=${encodeURIComponent(name)}`,
}

function isItemCollectionKey(key: unknown) {
  return typeof key === 'string'
    && (key === '/items' || key.startsWith('/items?') || key.startsWith('/items/search?'))
}

function isItemKey(key: unknown) {
  return typeof key === 'string' && key.startsWith('/items/') && !isItemCollectionKey(key)
}

/** Revalidate all mounted SWR resources affected by an inventory mutation. */
export async function revalidateInventory(options: {
  auth?: boolean
  categories?: boolean
  dashboard?: boolean
  household?: boolean
  items?: boolean
  itemDetails?: boolean
  locations?: boolean
  movements?: boolean
  rooms?: boolean
} = {}) {
  const filters: Array<(key?: unknown) => boolean> = []
  if (options.auth) filters.push(key => key === cacheKeys.authMe)
  if (options.categories) filters.push(key => key === cacheKeys.categories)
  if (options.dashboard) filters.push(key => key === cacheKeys.dashboard)
  if (options.household) filters.push(key => key === cacheKeys.household)
  if (options.items) filters.push(isItemCollectionKey)
  if (options.itemDetails) filters.push(isItemKey)
  if (options.locations) filters.push(key => key === cacheKeys.locations)
  if (options.movements) filters.push(key => key === cacheKeys.movements)
  if (options.rooms) filters.push(key => key === cacheKeys.rooms)

  await Promise.all(filters.map(filter => mutate(filter)))
}
