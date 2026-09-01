import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { categoryApi } from '../api/categoryApi'
import { itemApi } from '../api/itemApi'
import { roomApi } from '../api/roomApi'
import { storageLocationApi } from '../api/storageLocationApi'
import BulkMoveItemsModal from '../components/BulkMoveItemsModal'
import ItemPhoto from '../components/ItemPhoto'
import { Empty, ErrorMessage, Loading } from '../components/PageState'
import type { BulkMoveItemsResponse, Category, Item, Room, StorageLocation } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function ItemCardContent({ item }: { item: Item }) {
  return <>
    <ItemPhoto
      photoUrl={item.photoUrl}
      cacheKey={item.updatedAt}
      alt={`Photo of ${item.name}`}
      fallbackLabel={`No photo available for ${item.name}`}
      className="h-24 w-24 shrink-0 rounded-xl border"
    />
    <div className="min-w-0 flex-1">
      <div className="flex justify-between gap-3">
        <h2 className="truncate text-lg group-hover:text-pine">{item.name}</h2>
        <span className="font-semibold">
          {item.estimatedValue == null ? 'Value not recorded' : money.format(item.estimatedValue * item.quantity)}
        </span>
      </div>
      <p className="mt-1 text-sm text-stone-500">{item.roomName} → {item.storageLocationName}</p>
      <div className="mt-3 flex gap-2 text-xs">
        <span className="rounded-full bg-stone-100 px-2 py-1">{item.categoryName}</span>
        <span className="rounded-full bg-stone-100 px-2 py-1">Qty {item.quantity}</span>
      </div>
    </div>
  </>
}

export default function ItemsPage() {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<Item[]>()
  const [rooms, setRooms] = useState<Room[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<StorageLocation[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)

  const q = params.get('q') ?? ''
  const roomId = params.get('roomId') ?? ''
  const categoryId = params.get('categoryId') ?? ''
  const storageLocationId = params.get('storageLocationId') ?? ''

  const loadItems = useCallback(
    () => q ? itemApi.search(q) : itemApi.list({ roomId, categoryId, storageLocationId }),
    [q, roomId, categoryId, storageLocationId],
  )

  useEffect(() => {
    Promise.all([roomApi.list(), categoryApi.list(), storageLocationApi.list()])
      .then(([nextRooms, nextCategories, nextLocations]) => {
        setRooms(nextRooms)
        setCategories(nextCategories)
        setLocations(nextLocations)
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load filters.'))
  }, [])

  useEffect(() => {
    let ignore = false
    setItems(undefined)
    setError('')
    setSuccess('')
    setIsSelecting(false)
    setSelectedIds(new Set())
    setIsMoveDialogOpen(false)

    loadItems()
      .then(nextItems => { if (!ignore) setItems(nextItems) })
      .catch(cause => { if (!ignore) setError(cause instanceof Error ? cause.message : 'Unable to load items.') })

    return () => { ignore = true }
  }, [loadItems])

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    if (key === 'roomId') next.delete('storageLocationId')
    next.delete('q')
    setParams(next)
  }

  function stopSelecting() {
    setIsSelecting(false)
    setSelectedIds(new Set())
  }

  function toggleItem(itemId: number) {
    setSelectedIds(current => {
      const next = new Set(current)
      next.has(itemId) ? next.delete(itemId) : next.add(itemId)
      return next
    })
  }

  function toggleAllVisible() {
    if (!items) return
    const everythingSelected = items.length > 0 && items.every(item => selectedIds.has(item.id))
    setSelectedIds(everythingSelected ? new Set() : new Set(items.map(item => item.id)))
  }

  async function finishMove(result: BulkMoveItemsResponse) {
    setIsMoveDialogOpen(false)
    stopSelecting()
    setSuccess(`${result.movedCount} ${result.movedCount === 1 ? 'item' : 'items'} moved to ${result.roomName} → ${result.storageLocationName}.`)
    setError('')
    setItems(undefined)
    window.dispatchEvent(new Event('inventory-changed'))

    try {
      setItems(await loadItems())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The items moved, but this view could not be refreshed.')
    }
  }

  const selectedCount = selectedIds.size
  const allVisibleSelected = items != null && items.length > 0 && items.every(item => selectedIds.has(item.id))
  const title = q
    ? `Results for “${q}”`
    : storageLocationId
      ? locations.find(location => String(location.id) === storageLocationId)?.name ?? 'Storage location'
      : roomId
        ? rooms.find(room => String(room.id) === roomId)?.name ?? 'Room items'
        : 'All items'

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">Your belongings</p>
        <h1 className="mt-2 text-4xl">{title}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {items?.length ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => isSelecting ? stopSelecting() : setIsSelecting(true)}
          >
            {isSelecting ? 'Cancel selection' : 'Select items'}
          </button>
        ) : null}
        <Link to="/items/new" className="btn-primary">＋ Add item</Link>
      </div>
    </div>

    <div className="mt-7 flex flex-wrap gap-3">
      <select aria-label="Filter by room" className="field w-auto min-w-44" value={roomId} onChange={event => filter('roomId', event.target.value)}>
        <option value="">All rooms</option>
        {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
      </select>
      <select aria-label="Filter by storage location" className="field w-auto min-w-44" value={storageLocationId} onChange={event => filter('storageLocationId', event.target.value)}>
        <option value="">All locations</option>
        {locations.filter(location => !roomId || String(location.roomId) === roomId).map(location => (
          <option key={location.id} value={location.id}>{location.name}</option>
        ))}
      </select>
      <select aria-label="Filter by category" className="field w-auto min-w-44" value={categoryId} onChange={event => filter('categoryId', event.target.value)}>
        <option value="">All categories</option>
        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      {(q || roomId || categoryId || storageLocationId) && (
        <button type="button" className="btn-secondary" onClick={() => setParams({})}>Clear filters</button>
      )}
    </div>

    {success && (
      <div role="status" className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <span>{success}</span>
        <button type="button" className="rounded-lg px-2 py-1 font-semibold hover:bg-emerald-100" aria-label="Dismiss move confirmation" onClick={() => setSuccess('')}>×</button>
      </div>
    )}

    {isSelecting && items?.length ? (
      <section aria-label="Bulk item actions" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pine/20 bg-sage/60 px-4 py-3">
        <p role="status" className="text-sm font-semibold text-pine">
          {selectedCount ? `${selectedCount} ${selectedCount === 1 ? 'item' : 'items'} selected` : 'Choose the items you want to move'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={toggleAllVisible}>
            {allVisibleSelected ? 'Clear selection' : 'Select all visible'}
          </button>
          <button type="button" className="btn-primary" disabled={!selectedCount} onClick={() => setIsMoveDialogOpen(true)}>
            {selectedCount ? `Move ${selectedCount} ${selectedCount === 1 ? 'item' : 'items'}` : 'Move items'}
          </button>
        </div>
      </section>
    ) : null}

    <div className="mt-6">
      {error ? <ErrorMessage message={error} /> : !items ? <Loading /> : !items.length ? (
        <Empty>No items match this view. Add one or try different filters.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(item => isSelecting ? (
            <label
              className={`card group flex cursor-pointer gap-4 transition ${selectedIds.has(item.id) ? 'border-pine ring-2 ring-pine/10' : 'hover:border-stone-300'}`}
              key={item.id}
            >
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-pine"
                checked={selectedIds.has(item.id)}
                onChange={() => toggleItem(item.id)}
                aria-label={`Select ${item.name}`}
              />
              <ItemCardContent item={item} />
            </label>
          ) : (
            <Link to={`/items/${item.id}`} className="card group flex gap-4" key={item.id}>
              <ItemCardContent item={item} />
            </Link>
          ))}
        </div>
      )}
    </div>

    {isMoveDialogOpen && selectedCount > 0 && (
      <BulkMoveItemsModal
        itemIds={[...selectedIds]}
        rooms={rooms}
        locations={locations}
        onClose={() => setIsMoveDialogOpen(false)}
        onMoved={finishMove}
      />
    )}
  </>
}
