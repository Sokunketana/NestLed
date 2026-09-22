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
  }, [categoryId, itemKey, q, roomId, storageLocationId])

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
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
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
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
  const activeFilterCount = [q, roomId, storageLocationId, categoryId].filter(Boolean).length
  const selectedRoom = roomList.find(room => String(room.id) === roomId)
  const selectedLocation = locationList.find(location => String(location.id) === storageLocationId)
  const selectedCategory = categoryList.find(category => String(category.id) === categoryId)
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
        <div className="flex flex-wrap items-center gap-3"><h1 className="page-title">{title}</h1>{items && <span className="rounded-full bg-sage px-2.5 py-1 text-xs font-bold text-pine">{items.length} {items.length === 1 ? 'entry' : 'entries'}</span>}</div>
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

    <section aria-labelledby="item-filters-title" className="mt-7 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage text-pine" aria-hidden="true">
            <Icon name="sliders" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="item-filters-title" className="font-sans text-sm font-bold tracking-normal text-ink">Refine your items</h2>
              {activeFilterCount > 0 && <span className="rounded-full bg-pine px-2 py-0.5 text-[0.7rem] font-bold text-white">{activeFilterCount} active</span>}
            </div>
            <p className="mt-0.5 hidden text-xs text-ink-soft sm:block">Narrow the list by where an item lives or how it is grouped.</p>
          </div>
        </div>
        <button type="button" className="btn-secondary shrink-0 px-3 py-2 sm:hidden" aria-expanded={showFilters} aria-controls="item-filter-fields" onClick={() => setShowFilters(current => !current)}>
          {showFilters ? 'Hide' : 'Show'} <Icon name="chevron-down" className={`h-4 w-4 transition ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <div id="item-filter-fields" className={`${showFilters ? 'grid' : 'hidden'} gap-3 p-4 sm:grid sm:grid-cols-3 sm:p-5`}>
        <label className="block">
          <span className="label">Room</span>
          <select aria-label="Filter by room" className="field bg-white" value={roomId} onChange={event => filter('roomId', event.target.value)}>
            <option value="">All rooms</option>
            {roomList.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Storage location</span>
          <select aria-label="Filter by storage location" className="field bg-white" value={storageLocationId} onChange={event => filter('storageLocationId', event.target.value)}>
            <option value="">All locations</option>
            {locationList.filter(location => !roomId || String(location.roomId) === roomId).map(location => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Category</span>
          <select aria-label="Filter by category" className="field bg-white" value={categoryId} onChange={event => filter('categoryId', event.target.value)}>
            <option value="">All categories</option>
            {categoryList.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
      </div>
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line/70 bg-cream/60 px-4 py-3 sm:px-5">
          <span className="mr-1 text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">Applied</span>
          {q && <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-pine/15 bg-white px-3 py-1.5 text-xs font-semibold text-pine transition hover:border-pine/30 hover:bg-mint" onClick={() => filter('q', '')}>Search: “{q}” <Icon name="x" className="h-3.5 w-3.5" /></button>}
          {selectedRoom && <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-pine/15 bg-white px-3 py-1.5 text-xs font-semibold text-pine transition hover:border-pine/30 hover:bg-mint" onClick={() => filter('roomId', '')}>Room: {selectedRoom.name} <Icon name="x" className="h-3.5 w-3.5" /></button>}
          {selectedLocation && <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-pine/15 bg-white px-3 py-1.5 text-xs font-semibold text-pine transition hover:border-pine/30 hover:bg-mint" onClick={() => filter('storageLocationId', '')}>Location: {selectedLocation.name} <Icon name="x" className="h-3.5 w-3.5" /></button>}
          {selectedCategory && <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-pine/15 bg-white px-3 py-1.5 text-xs font-semibold text-pine transition hover:border-pine/30 hover:bg-mint" onClick={() => filter('categoryId', '')}>Category: {selectedCategory.name} <Icon name="x" className="h-3.5 w-3.5" /></button>}
          <button type="button" className="ml-auto px-1 py-1.5 text-xs font-bold text-stone-500 transition hover:text-pine" onClick={() => setParams({})}>Clear all</button>
        </div>
      )}
    </section>

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
