import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { itemApi } from '../api/itemApi'
import { roomApi } from '../api/roomApi'
import { categoryApi } from '../api/categoryApi'
import ItemPhoto from '../components/ItemPhoto'
import { Empty, ErrorMessage, Loading } from '../components/PageState'
import type { Category, Item, Room, StorageLocation } from '../types'
import { storageLocationApi } from '../api/storageLocationApi'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function ItemsPage() {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<Item[]>()
  const [rooms, setRooms] = useState<Room[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<StorageLocation[]>([])
  const [error, setError] = useState('')
  const q = params.get('q') ?? ''
  const roomId = params.get('roomId') ?? ''
  const categoryId = params.get('categoryId') ?? ''
  const storageLocationId = params.get('storageLocationId') ?? ''
  useEffect(() => { Promise.all([roomApi.list(), categoryApi.list(), storageLocationApi.list()]).then(([r,c,l]) => { setRooms(r); setCategories(c); setLocations(l) }) }, [])
  useEffect(() => {
    setItems(undefined); setError('')
    const call = q ? itemApi.search(q) : itemApi.list({ roomId, categoryId, storageLocationId })
    call.then(setItems).catch(e => setError(e.message))
  }, [q, roomId, categoryId, storageLocationId])
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key)
    if (key === 'roomId') next.delete('storageLocationId')
    next.delete('q'); setParams(next)
  }
  return <>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Your belongings</p><h1 className="mt-2 text-4xl">{q ? `Results for “${q}”` : storageLocationId ? locations.find(l => String(l.id) === storageLocationId)?.name ?? 'Storage location' : roomId ? rooms.find(r => String(r.id) === roomId)?.name ?? 'Room items' : 'All items'}</h1></div><Link to="/items/new" className="btn-primary">＋ Add item</Link></div>
    <div className="mt-7 flex flex-wrap gap-3">
      <select aria-label="Filter by room" className="field w-auto min-w-44" value={roomId} onChange={e => filter('roomId', e.target.value)}><option value="">All rooms</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
      <select aria-label="Filter by storage location" className="field w-auto min-w-44" value={storageLocationId} onChange={e => filter('storageLocationId', e.target.value)}><option value="">All locations</option>{locations.filter(l => !roomId || String(l.roomId) === roomId).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
      <select aria-label="Filter by category" className="field w-auto min-w-44" value={categoryId} onChange={e => filter('categoryId', e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      {(q || roomId || categoryId || storageLocationId) && <button className="btn-secondary" onClick={() => setParams({})}>Clear filters</button>}
    </div>
    <div className="mt-6">{error ? <ErrorMessage message={error} /> : !items ? <Loading /> : !items.length ? <Empty>No items match this view. Add one or try different filters.</Empty> :
      <div className="grid gap-4 md:grid-cols-2">{items.map(item => <Link to={`/items/${item.id}`} className="card group flex gap-4" key={item.id}>
        <ItemPhoto photoUrl={item.photoUrl} cacheKey={item.updatedAt} alt={`Photo of ${item.name}`} fallbackLabel={`No photo available for ${item.name}`} className="h-24 w-24 shrink-0 rounded-xl border" />
        <div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h2 className="truncate text-lg group-hover:text-pine">{item.name}</h2><span className="font-semibold">{item.estimatedValue == null ? 'Value not recorded' : money.format(item.estimatedValue * item.quantity)}</span></div>
          <p className="mt-1 text-sm text-stone-500">{item.roomName} → {item.storageLocationName}</p>
          <div className="mt-3 flex gap-2 text-xs"><span className="rounded-full bg-stone-100 px-2 py-1">{item.categoryName}</span><span className="rounded-full bg-stone-100 px-2 py-1">Qty {item.quantity}</span></div>
        </div>
      </Link>)}</div>}</div>
  </>
}
