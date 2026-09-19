import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import { itemApi } from '../api/itemApi'
import { cacheKeys } from '../api/cache'
import { roomApi } from '../api/roomApi'
import { storageLocationApi } from '../api/storageLocationApi'
import Icon from './Icon'
import type { Item, Room, StorageLocation } from '../types'

const EMPTY_ROOMS: Room[] = []
const EMPTY_LOCATIONS: StorageLocation[] = []
const EMPTY_ITEMS: Item[] = []

type HomeTreeProps = {
  variant?: 'sidebar' | 'page'
}

export default function HomeTree({ variant = 'sidebar' }: HomeTreeProps) {
  const isPage = variant === 'page'
  const route = useLocation()
  const [params] = useSearchParams()
  const { data: rooms, error: roomsError } = useSWR<Room[]>(cacheKeys.rooms, roomApi.list)
  const { data: locations, error: locationsError } = useSWR<StorageLocation[]>(cacheKeys.locations, storageLocationApi.list)
  const { data: items, error: itemsError } = useSWR<Item[]>(cacheKeys.itemList(), itemApi.list)
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set())
  const [expandedLocations, setExpandedLocations] = useState<Set<number>>(new Set())

  const roomList = rooms ?? EMPTY_ROOMS
  const locationList = locations ?? EMPTY_LOCATIONS
  const itemList = items ?? EMPTY_ITEMS
  const error = roomsError || locationsError || itemsError

  const activeItemId = route.pathname.match(/^\/items\/(\d+)(?:\/edit)?$/)?.[1]
  const activeRoomId = Number(params.get('roomId')) || undefined
  const activeLocationId = Number(params.get('storageLocationId')) || undefined
  const activeItem = itemList.find(item => item.id === Number(activeItemId))
  const activeLocation = locationList.find(location => location.id === activeLocationId)

  useEffect(() => {
    const roomId = activeItem?.roomId ?? activeRoomId ?? activeLocation?.roomId
    const locationId = activeItem?.storageLocationId ?? activeLocationId
    if (roomId) setExpandedRooms(old => new Set(old).add(roomId))
    if (locationId) setExpandedLocations(old => new Set(old).add(locationId))
  }, [activeItem?.roomId, activeItem?.storageLocationId, activeRoomId, activeLocationId, activeLocation?.roomId])

  const locationsByRoom = useMemo(() => {
    const grouped = new Map<number, StorageLocation[]>()
    locationList.forEach(location => grouped.set(location.roomId, [...(grouped.get(location.roomId) ?? []), location]))
    return grouped
  }, [locationList])

  const itemsByLocation = useMemo(() => {
    const grouped = new Map<number, Item[]>()
    itemList.forEach(item => grouped.set(item.storageLocationId, [...(grouped.get(item.storageLocationId) ?? []), item]))
    return grouped
  }, [itemList])

  function toggle(setter: Dispatch<SetStateAction<Set<number>>>, id: number) {
    setter(old => {
      const next = new Set(old)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return <section aria-labelledby={isPage ? 'home-tree-title' : undefined} className={isPage ? 'card overflow-hidden p-0' : 'mt-4 border-t border-white/10 pt-5'}>
    <div className={isPage ? 'flex flex-wrap items-end gap-3 border-b border-line px-5 py-5 sm:px-6' : 'flex items-center justify-between px-2'}>
      <div>
        <p className={isPage ? 'eyebrow' : 'text-[0.64rem] font-bold uppercase tracking-[0.2em] text-emerald-200/75'}>{isPage ? 'Home tree' : 'Your home'}</p>
        {isPage && <h2 id="home-tree-title" className="mt-2 text-2xl">Rooms, locations & items</h2>}
      </div>
      {!isPage && <Link to="/rooms" className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-100 hover:bg-white/10">Manage</Link>}
    </div>
    <div className={isPage ? 'max-h-[calc(100vh-18rem)] space-y-1 overflow-y-auto overscroll-contain p-3 text-sm sm:p-5' : 'mt-2 max-h-[35vh] space-y-1 overflow-y-auto overscroll-contain pr-1 text-sm lg:max-h-[calc(100vh-20rem)]'}>
      {error && <p className={isPage ? 'rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700' : 'rounded-lg bg-red-950/30 px-3 py-2 text-xs text-red-100'}>Could not load the home tree.</p>}
      {!error && !roomList.length && <p className={isPage ? 'rounded-xl border border-dashed border-line px-3 py-8 text-center text-sm text-ink-soft' : 'px-3 py-2 text-xs text-emerald-100'}>Add a room and storage location to begin.</p>}
      {roomList.map(room => {
        const roomOpen = expandedRooms.has(room.id)
        const roomLocations = locationsByRoom.get(room.id) ?? []
        const roomActive = activeRoomId === room.id && !activeLocationId
        return <div key={room.id}>
          <div className={`flex items-center rounded-xl ${isPage ? 'border' : ''} ${roomActive ? (isPage ? 'border-pine/15 bg-mint text-deep' : 'bg-white text-deep shadow-sm') : (isPage ? 'border-transparent text-ink hover:bg-cream' : 'hover:bg-white/10')}`}>
            <button type="button" aria-label={`${roomOpen ? 'Collapse' : 'Expand'} ${room.name}`} aria-expanded={roomOpen}
              className={`grid h-9 w-8 shrink-0 place-items-center ${isPage ? 'text-ink-soft' : ''}`} onClick={() => toggle(setExpandedRooms, room.id)}>
              {roomLocations.length ? <Icon name={roomOpen ? 'chevron-down' : 'chevron-right'} className="h-3.5 w-3.5" /> : <span className="text-xs opacity-60">•</span>}
            </button>
            <button type="button" aria-label={`${roomOpen ? 'Collapse' : 'Expand'} ${room.name}`} aria-expanded={roomOpen}
              className="min-w-0 flex-1 truncate py-2 pr-2 text-left font-semibold" onClick={() => toggle(setExpandedRooms, room.id)}>
              {room.name}
            </button>
            <span className={`mr-3 text-xs ${roomActive ? 'text-deep/60' : isPage ? 'text-stone-500' : 'text-emerald-200'}`}>{room.itemCount}</span>
          </div>
          {roomOpen && <div className={`ml-4 border-l pl-2 ${isPage ? 'border-line' : 'border-white/20'}`}>
            {roomLocations.map(storage => {
              const locationOpen = expandedLocations.has(storage.id)
              const locationItems = itemsByLocation.get(storage.id) ?? []
              const locationActive = activeLocationId === storage.id && !activeItemId
              return <div key={storage.id}>
                <div className={`flex items-center rounded-xl ${isPage ? 'border' : ''} ${locationActive ? (isPage ? 'border-pine/15 bg-mint text-deep' : 'bg-white text-deep shadow-sm') : (isPage ? 'border-transparent text-ink hover:bg-cream' : 'hover:bg-white/10')}`}>
                  <button type="button" aria-label={`${locationOpen ? 'Collapse' : 'Expand'} ${storage.name}`} aria-expanded={locationOpen}
                    className={`grid h-8 w-7 shrink-0 place-items-center ${isPage ? 'text-ink-soft' : ''}`} onClick={() => toggle(setExpandedLocations, storage.id)}>
                    {locationItems.length ? <Icon name={locationOpen ? 'chevron-down' : 'chevron-right'} className="h-3 w-3" /> : <span className="text-xs opacity-60">•</span>}
                  </button>
                  <button type="button" aria-label={`${locationOpen ? 'Collapse' : 'Expand'} ${storage.name}`} aria-expanded={locationOpen}
                    className="min-w-0 flex-1 truncate py-1.5 pr-2 text-left" onClick={() => toggle(setExpandedLocations, storage.id)}>
                    {storage.name}
                  </button>
                  <span className={`mr-3 text-xs ${locationActive ? 'text-deep/60' : isPage ? 'text-stone-500' : 'text-emerald-200'}`}>{storage.itemCount}</span>
                </div>
                {locationOpen && <div className={`ml-3 border-l py-1 pl-2 ${isPage ? 'border-line' : 'border-white/20'}`}>
                  {locationItems.map(item => <Link key={item.id} to={`/items/${item.id}`}
                    className={`block truncate rounded-lg px-3 py-1.5 ${Number(activeItemId) === item.id ? (isPage ? 'bg-mint font-semibold text-deep' : 'bg-white font-semibold text-deep') : isPage ? 'text-ink hover:bg-cream' : 'text-emerald-50 hover:bg-white/10'}`}>
                    <span className="mr-1.5 text-coral">•</span>{item.name}
                  </Link>)}
                </div>}
              </div>
            })}
            {!roomLocations.length && <p className={`px-3 py-2 text-xs ${isPage ? 'text-ink-soft' : 'text-emerald-200'}`}>No storage locations</p>}
          </div>}
        </div>
      })}
    </div>
  </section>
}
