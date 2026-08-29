import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { itemApi } from '../api/itemApi'
import { roomApi } from '../api/roomApi'
import { storageLocationApi } from '../api/storageLocationApi'
import type { Item, Room, StorageLocation } from '../types'

export default function HomeTree() {
  const route = useLocation()
  const [params] = useSearchParams()
  const [rooms, setRooms] = useState<Room[]>([])
  const [locations, setLocations] = useState<StorageLocation[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set())
  const [expandedLocations, setExpandedLocations] = useState<Set<number>>(new Set())
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    const load = () => {
      setError(false)
      Promise.all([roomApi.list(), storageLocationApi.list(), itemApi.list()])
        .then(([nextRooms, nextLocations, nextItems]) => {
          if (!active) return
          setRooms(nextRooms); setLocations(nextLocations); setItems(nextItems)
        })
        .catch(() => { if (active) setError(true) })
    }
    load()
    window.addEventListener('inventory-changed', load)
    return () => { active = false; window.removeEventListener('inventory-changed', load) }
  }, [route.key])

  const activeItemId = route.pathname.match(/^\/items\/(\d+)(?:\/edit)?$/)?.[1]
  const activeRoomId = Number(params.get('roomId')) || undefined
  const activeLocationId = Number(params.get('storageLocationId')) || undefined
  const activeItem = items.find(item => item.id === Number(activeItemId))
  const activeLocation = locations.find(location => location.id === activeLocationId)

  useEffect(() => {
    const roomId = activeItem?.roomId ?? activeRoomId ?? activeLocation?.roomId
    const locationId = activeItem?.storageLocationId ?? activeLocationId
    if (roomId) setExpandedRooms(old => new Set(old).add(roomId))
    if (locationId) setExpandedLocations(old => new Set(old).add(locationId))
  }, [activeItem?.roomId, activeItem?.storageLocationId, activeRoomId, activeLocationId, activeLocation?.roomId])

  const locationsByRoom = useMemo(() => {
    const grouped = new Map<number, StorageLocation[]>()
    locations.forEach(location => grouped.set(location.roomId, [...(grouped.get(location.roomId) ?? []), location]))
    return grouped
  }, [locations])

  const itemsByLocation = useMemo(() => {
    const grouped = new Map<number, Item[]>()
    items.forEach(item => grouped.set(item.storageLocationId, [...(grouped.get(item.storageLocationId) ?? []), item]))
    return grouped
  }, [items])

  function toggle(setter: Dispatch<SetStateAction<Set<number>>>, id: number) {
    setter(old => {
      const next = new Set(old)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return <div className="mt-5 border-t border-white/15 pt-5">
    <div className="flex items-center justify-between px-2">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Your home</p>
      <Link to="/rooms" className="rounded px-2 py-1 text-xs font-semibold text-emerald-100 hover:bg-white/10">Manage</Link>
    </div>
    <div className="mt-2 max-h-[calc(100vh-23rem)] space-y-1 overflow-y-auto pr-1 text-sm lg:max-h-[calc(100vh-20rem)]">
      {error && <p className="rounded-lg bg-red-950/30 px-3 py-2 text-xs text-red-100">Could not load the home tree.</p>}
      {!error && !rooms.length && <p className="px-3 py-2 text-xs text-emerald-100">Add a room and storage location to begin.</p>}
      {rooms.map(room => {
        const roomOpen = expandedRooms.has(room.id)
        const roomLocations = locationsByRoom.get(room.id) ?? []
        const roomActive = activeRoomId === room.id && !activeLocationId
        return <div key={room.id}>
          <div className={`flex items-center rounded-lg ${roomActive ? 'bg-white text-pine' : 'hover:bg-white/10'}`}>
            <button type="button" aria-label={`${roomOpen ? 'Collapse' : 'Expand'} ${room.name}`} aria-expanded={roomOpen}
              className="grid h-9 w-8 shrink-0 place-items-center text-xs" onClick={() => toggle(setExpandedRooms, room.id)}>
              {roomLocations.length ? (roomOpen ? '▾' : '▸') : '·'}
            </button>
            <Link className="min-w-0 flex-1 truncate py-2 pr-2 font-semibold" to={`/items?roomId=${room.id}`}>{room.name}</Link>
            <span className={`mr-2 text-xs ${roomActive ? 'text-pine/60' : 'text-emerald-200'}`}>{room.itemCount}</span>
          </div>
          {roomOpen && <div className="ml-4 border-l border-white/20 pl-2">
            {roomLocations.map(storage => {
              const locationOpen = expandedLocations.has(storage.id)
              const locationItems = itemsByLocation.get(storage.id) ?? []
              const locationActive = activeLocationId === storage.id && !activeItemId
              return <div key={storage.id}>
                <div className={`flex items-center rounded-lg ${locationActive ? 'bg-white text-pine' : 'hover:bg-white/10'}`}>
                  <button type="button" aria-label={`${locationOpen ? 'Collapse' : 'Expand'} ${storage.name}`} aria-expanded={locationOpen}
                    className="grid h-8 w-7 shrink-0 place-items-center text-xs" onClick={() => toggle(setExpandedLocations, storage.id)}>
                    {locationItems.length ? (locationOpen ? '▾' : '▸') : '·'}
                  </button>
                  <Link className="min-w-0 flex-1 truncate py-1.5 pr-2" to={`/items?roomId=${room.id}&storageLocationId=${storage.id}`}>{storage.name}</Link>
                  <span className={`mr-2 text-xs ${locationActive ? 'text-pine/60' : 'text-emerald-200'}`}>{storage.itemCount}</span>
                </div>
                {locationOpen && <div className="ml-3 border-l border-white/20 py-1 pl-2">
                  {locationItems.map(item => <Link key={item.id} to={`/items/${item.id}`}
                    className={`block truncate rounded-lg px-3 py-1.5 ${Number(activeItemId) === item.id ? 'bg-white font-semibold text-pine' : 'text-emerald-50 hover:bg-white/10'}`}>
                    <span className="mr-1.5 text-emerald-300">•</span>{item.name}
                  </Link>)}
                </div>}
              </div>
            })}
            {!roomLocations.length && <p className="px-3 py-2 text-xs text-emerald-200">No storage locations</p>}
          </div>}
        </div>
      })}
    </div>
  </div>
}
