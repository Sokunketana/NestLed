import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import { categoryApi } from '../api/categoryApi'
import { cacheKeys, revalidateInventory } from '../api/cache'
import { itemApi } from '../api/itemApi'
import { roomApi } from '../api/roomApi'
import { storageLocationApi } from '../api/storageLocationApi'
import BulkMoveItemsModal from '../components/BulkMoveItemsModal'
import ItemPhoto from '../components/ItemPhoto'
import { Empty, ErrorMessage, Loading } from '../components/PageState'
import Icon from '../components/Icon'
import type { BulkMoveItemsResponse, Category, Item, Room, StorageLocation } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function ItemCardContent({ item }: { item: Item }) {
  return <>
    <ItemPhoto
      photoUrl={item.photoUrl}
      cacheKey={item.updatedAt}
      alt={`Photo of ${item.name}`}
      fallbackLabel={`No photo available for ${item.name}`}
      className="h-24 w-24 shrink-0 rounded-2xl border sm:h-28 sm:w-28"
    />
    <div className="min-w-0 flex-1">
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <h2 className="min-w-0 max-w-full truncate text-xl group-hover:text-pine">{item.name}</h2>
        <span className="shrink-0 text-left text-sm font-bold text-pine sm:text-right">
          {item.estimatedValue == null ? 'Value not recorded' : money.format(item.estimatedValue * item.quantity)}
        </span>
      </div>
      <p className="mt-2 flex min-w-0 items-start gap-1.5 text-sm text-ink-soft"><Icon name="map" className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0 break-words">{item.roomName} <span className="text-stone-400">/</span> {item.storageLocationName}</span></p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-coral/10 px-2.5 py-1 font-semibold text-[#a64d39]">{item.categoryName}</span>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 font-semibold text-stone-600">Qty {item.quantity}</span>
      </div>
    </div>
  </>
}

export default function ItemsPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const roomId = params.get('roomId') ?? ''
  const categoryId = params.get('categoryId') ?? ''
  const storageLocationId = params.get('storageLocationId') ?? ''

  const itemKey = q
    ? cacheKeys.itemSearch(q)
    : cacheKeys.itemList({ roomId, categoryId, storageLocationId })
  const { data: items, error: itemError } = useSWR<Item[]>(
    itemKey,
    q ? () => itemApi.search(q) : () => itemApi.list({ roomId, categoryId, storageLocationId }),
  )
  const { data: rooms, error: roomsError } = useSWR<Room[]>(cacheKeys.rooms, roomApi.list)
  const { data: categories, error: categoriesError } = useSWR<Category[]>(cacheKeys.categories, categoryApi.list)
  const { data: locations, error: locationsError } = useSWR<StorageLocation[]>(cacheKeys.locations, storageLocationApi.list)

  const roomList = rooms ?? []
  const categoryList = categories ?? []
  const locationList = locations ?? []
  const loadError = itemError || roomsError || categoriesError || locationsError
  const [actionError, setActionError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSelecting, setIsSelecting] = useState(false)
  const [showFilters, setShowFilters] = useState(() => Boolean(q || roomId || categoryId || storageLocationId))
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)

  useEffect(() => {
    setActionError('')
    setSuccess('')
    setIsSelecting(false)
    setShowFilters(Boolean(q || roomId || categoryId || storageLocationId))
    setSelectedIds(new Set())
    setIsMoveDialogOpen(false)
  }, [itemKey])

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
    setActionError('')
    try {
      await revalidateInventory({ dashboard: true, items: true, itemDetails: true, locations: true, movements: true, rooms: true })
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The items moved, but this view could not be refreshed.')
    }
  }

  const selectedCount = selectedIds.size
  const allVisibleSelected = items != null && items.length > 0 && items.every(item => selectedIds.has(item.id))
  const activeFilterCount = [roomId, storageLocationId, categoryId].filter(Boolean).length
  const title = q
    ? `Results for “${q}”`
    : storageLocationId
      ? locationList.find(location => String(location.id) === storageLocationId)?.name ?? 'Storage location'
      : roomId
        ? roomList.find(room => String(room.id) === roomId)?.name ?? 'Room items'
        : 'All items'

  return <>
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="eyebrow">Your belongings</p>
        <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="page-title">{title}</h1>{items && <span className="rounded-full bg-sage px-2.5 py-1 text-xs font-bold text-pine">{items.length} {items.length === 1 ? 'entry' : 'entries'}</span>}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {items?.length ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => isSelecting ? stopSelecting() : setIsSelecting(true)}
          >
            <Icon name={isSelecting ? 'x' : 'check'} className="h-4 w-4" />{isSelecting ? 'Cancel selection' : 'Select items'}
          </button>
        ) : null}
        <Link to="/items/new" className="btn-primary"><Icon name="plus" className="h-4 w-4" />Add item</Link>
      </div>
    </div>

    <div className="mt-7 rounded-2xl border border-line bg-white/65 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-1 text-sm font-bold text-ink">
          <Icon name="sliders" className="h-4 w-4 text-pine" />
          <span>Filter items</span>
          {activeFilterCount > 0 && <span className="rounded-full bg-sage px-2 py-0.5 text-xs text-pine">{activeFilterCount} active</span>}
        </div>
        <button type="button" className="btn-secondary px-3 py-2" aria-expanded={showFilters} onClick={() => setShowFilters(current => !current)}>
          {showFilters ? 'Hide filters' : 'Show filters'}
        </button>
      </div>
      {showFilters && <div className="mt-3 grid gap-3 sm:flex sm:flex-wrap">
        <select aria-label="Filter by room" className="field w-full bg-white sm:w-auto sm:min-w-44" value={roomId} onChange={event => filter('roomId', event.target.value)}>
          <option value="">Every room</option>
          {roomList.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
        </select>
        <select aria-label="Filter by storage location" className="field w-full bg-white sm:w-auto sm:min-w-44" value={storageLocationId} onChange={event => filter('storageLocationId', event.target.value)}>
          <option value="">Every location</option>
          {locationList.filter(location => !roomId || String(location.roomId) === roomId).map(location => (
            <option key={location.id} value={location.id}>{location.name}</option>
          ))}
        </select>
        <select aria-label="Filter by category" className="field w-full bg-white sm:w-auto sm:min-w-44" value={categoryId} onChange={event => filter('categoryId', event.target.value)}>
          <option value="">Every category</option>
          {categoryList.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        {(q || roomId || categoryId || storageLocationId) && (
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setParams({})}><Icon name="x" className="h-4 w-4" />Clear filters</button>
        )}
      </div>}
    </div>

    {success && (
      <div role="status" className="mt-6 flex flex-col items-start gap-2 rounded-2xl border border-emerald-200 bg-mint px-4 py-3 text-sm text-emerald-800 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span>{success}</span>
        <button type="button" className="rounded-lg p-1 font-semibold hover:bg-emerald-100" aria-label="Dismiss move confirmation" onClick={() => setSuccess('')}><Icon name="x" className="h-4 w-4" /></button>
      </div>
    )}

    {isSelecting && items?.length ? (
      <section aria-label="Bulk item actions" className="mt-6 flex flex-col items-stretch gap-3 rounded-2xl border border-pine/20 bg-sage/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" className="text-sm font-semibold text-pine">
          {selectedCount ? `${selectedCount} ${selectedCount === 1 ? 'item' : 'items'} selected` : 'Choose the items you want to move'}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={toggleAllVisible}>
            {allVisibleSelected ? 'Clear selection' : 'Select all visible'}
          </button>
          <button type="button" className="btn-primary w-full sm:w-auto" disabled={!selectedCount} onClick={() => setIsMoveDialogOpen(true)}>
            {selectedCount ? `Move ${selectedCount} ${selectedCount === 1 ? 'item' : 'items'}` : 'Move items'}
          </button>
        </div>
      </section>
    ) : null}

    <div className="mt-6">
      {actionError || loadError ? <ErrorMessage message={actionError || (loadError instanceof Error ? loadError.message : 'Unable to load items.')} /> : !items ? <Loading /> : !items.length ? (
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
            <Link to={`/items/${item.id}`} className="card group flex gap-4 transition hover:-translate-y-0.5 hover:shadow-soft" key={item.id}>
              <ItemCardContent item={item} />
            </Link>
          ))}
        </div>
      )}
    </div>

    {isMoveDialogOpen && selectedCount > 0 && (
      <BulkMoveItemsModal
        itemIds={[...selectedIds]}
        rooms={roomList}
        locations={locationList}
        onClose={() => setIsMoveDialogOpen(false)}
        onMoved={finishMove}
      />
    )}
  </>
}
