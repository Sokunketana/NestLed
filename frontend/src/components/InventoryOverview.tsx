import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { cacheKeys, revalidateInventory } from '../api/cache'
import { itemApi } from '../api/itemApi'
import { itemMovementApi } from '../api/itemMovementApi'
import { ErrorMessage, Loading } from './PageState'
import ConfirmationModal from './ConfirmationModal'
import Icon from './Icon'
import ItemPhoto from './ItemPhoto'
import type { Category, Dashboard, Item, ItemCondition, ItemMovement, ItemPayload, Room, StorageLocation } from '../types'
import { defaultLocationColor, defaultRoomColor, getSpaceColor, withColorAlpha } from '../spaceColors'

const activityDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

type InventoryOverviewProps = {
  dashboard: Dashboard
  rooms: Room[]
  locations: StorageLocation[]
  categories: Category[]
}

type AddItemModalProps = {
  rooms: Room[]
  locations: StorageLocation[]
  categories: Category[]
  defaultRoomId?: number
  defaultLocationId?: number
  onClose: () => void
  onSaved: (item: Item) => void
}

function AddItemModal({ rooms, locations, categories, defaultRoomId, defaultLocationId, onClose, onSaved }: AddItemModalProps) {
  const firstRoomId = defaultRoomId ?? rooms[0]?.id ?? 0
  const initialLocations = locations.filter(location => location.roomId === firstRoomId)
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState(firstRoomId)
  const [storageLocationId, setStorageLocationId] = useState(
    defaultLocationId && locations.some(location => location.id === defaultLocationId && location.roomId === firstRoomId)
      ? defaultLocationId
      : initialLocations[0]?.id ?? 0,
  )
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 0)
  const [quantity, setQuantity] = useState(1)
  const [condition, setCondition] = useState<ItemCondition>('GOOD')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const roomLocations = locations.filter(location => location.roomId === roomId)

  function changeRoom(nextRoomId: number) {
    setRoomId(nextRoomId)
    setStorageLocationId(locations.find(location => location.roomId === nextRoomId)?.id ?? 0)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!roomId || !storageLocationId || !categoryId) {
      setError('Choose a room, location, and category before saving.')
      return
    }

    setSaving(true)
    setError('')
    const payload: ItemPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      quantity,
      categoryId,
      roomId,
      storageLocationId,
      estimatedValue: undefined,
      purchaseDate: undefined,
      warrantyExpirationDate: undefined,
      condition,
      notes: notes.trim() || undefined,
    }

    try {
      const saved = await itemApi.create(payload)
      await revalidateInventory({ dashboard: true, items: true, itemDetails: true, locations: true, rooms: true })
      onSaved(saved)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to add this item.')
      setSaving(false)
    }
  }

  return <div className="fixed inset-0 z-40 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <section className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-line bg-surface shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="add-item-title">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-coral/10 text-[#a64d39]"><Icon name="plus" className="h-5 w-5" /></span>
          <div><h2 id="add-item-title" className="text-2xl">Add an item</h2><p className="mt-1 text-sm text-ink-soft">Give it a name and a place. You can fill in the extras later.</p></div>
        </div>
        <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-stone-400 hover:bg-cream hover:text-ink" aria-label="Close add item dialog" onClick={onClose} disabled={saving}><Icon name="x" className="h-5 w-5" /></button>
      </div>
      <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
        <section className="rounded-2xl border border-line bg-white/70 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="label">Item name *</span><input autoFocus required maxLength={150} className="field" placeholder="e.g. Passport" value={name} onChange={event => setName(event.target.value)} /></label>
            <label><span className="label">Room *</span><select required className="field" value={roomId || ''} onChange={event => changeRoom(Number(event.target.value))}><option value="">Select room</option>{rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label>
            <label><span className="label">Location *</span><select required className="field" value={storageLocationId || ''} onChange={event => setStorageLocationId(Number(event.target.value))} disabled={!roomId}><option value="">{roomId && !roomLocations.length ? 'No locations yet' : 'Select location'}</option>{roomLocations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
            <label><span className="label">Category *</span><select required className="field" value={categoryId || ''} onChange={event => setCategoryId(Number(event.target.value))}><option value="">Select category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label><span className="label">Quantity</span><input className="field" type="number" min="1" required value={quantity} onChange={event => setQuantity(Math.max(1, Number(event.target.value)))} /></label>
          </div>
        </section>
        <details className="rounded-2xl border border-line bg-white/70 p-4 group sm:p-5">
          <summary className="flex cursor-pointer list-none items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage text-pine"><Icon name="sliders" className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block font-bold">More details</span><span className="mt-0.5 block text-xs text-ink-soft">Optional description, condition, and notes</span></span><Icon name="chevron-down" className="h-4 w-4 text-stone-400 transition group-open:rotate-180" /></summary>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label><span className="label">Condition</span><select className="field" value={condition} onChange={event => setCondition(event.target.value as ItemCondition)}>{['NEW', 'GOOD', 'FAIR', 'DAMAGED'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
            <div />
            <label className="sm:col-span-2"><span className="label">Description</span><textarea className="field min-h-20" maxLength={1000} placeholder="Helpful identifying details" value={description} onChange={event => setDescription(event.target.value)} /></label>
            <label className="sm:col-span-2"><span className="label">Notes</span><textarea className="field min-h-20" maxLength={2000} placeholder="Serial number or anything else useful" value={notes} onChange={event => setNotes(event.target.value)} /></label>
          </div>
        </details>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn-primary" disabled={saving || !rooms.length || !locations.length || !categories.length}><Icon name="plus" className="h-4 w-4" />{saving ? 'Saving…' : 'Add item'}</button></div>
      </form>
    </section>
  </div>
}

function ItemDetailDialog({ item, onClose, onDeleted }: { item: Item; onClose: () => void; onDeleted: () => void }) {
  const { data: movements, error: movementsError } = useSWR<ItemMovement[]>(cacheKeys.movements, itemMovementApi.list)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const itemMovements = useMemo(() => (movements ?? []).filter(movement => movement.itemId === item.id), [item.id, movements])

  async function remove() {
    await itemApi.remove(item.id)
    await revalidateInventory({ dashboard: true, items: true, locations: true, movements: true, rooms: true })
    onDeleted()
  }

  return <>
    <div className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }} />
    <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-xl flex-col overflow-y-auto border-l border-line bg-surface shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="item-detail-title">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur sm:px-7"><div className="flex items-center gap-2 text-sm font-bold text-pine"><Icon name="box" className="h-4 w-4" /> Item detail</div><button type="button" className="grid h-9 w-9 place-items-center rounded-xl text-stone-400 hover:bg-cream hover:text-ink" aria-label="Close item detail" onClick={onClose}><Icon name="x" className="h-5 w-5" /></button></div>
      <div className="space-y-6 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><div className="min-w-0"><h2 id="item-detail-title" className="break-words text-3xl">{item.name}</h2><p className="mt-2 flex items-start gap-1.5 text-sm text-ink-soft"><Icon name="map" className="mt-0.5 h-4 w-4 shrink-0" />{item.roomName} <span className="text-stone-400">/</span> {item.storageLocationName}</p></div><span className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-bold text-[#a64d39]">{item.categoryName}</span></div>
        <ItemPhoto photoUrl={item.photoUrl} cacheKey={item.updatedAt} alt={`Photo of ${item.name}`} fallbackLabel={`No photo available for ${item.name}`} className="aspect-[16/9] w-full rounded-2xl border" loading="eager" expandable />
        <section className="card"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-sage text-pine"><Icon name="sliders" className="h-4 w-4" /></span><h3 className="text-xl">Item details</h3></div><dl className="mt-4 divide-y divide-line"><div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-stone-500">Condition</dt><dd className="font-semibold">{item.condition}</dd></div><div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-stone-500">Quantity</dt><dd className="font-semibold">{item.quantity}</dd></div><div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-stone-500">Added</dt><dd className="text-right font-semibold">{activityDate.format(new Date(item.createdAt))}</dd></div></dl>{item.description && <p className="mt-4 whitespace-pre-line border-t border-line pt-4 text-sm leading-relaxed text-stone-600">{item.description}</p>}{item.notes && <p className="mt-4 whitespace-pre-line rounded-xl bg-cream px-4 py-3 text-sm leading-relaxed text-stone-600">{item.notes}</p>}</section>
        <section className="card"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-amber-700"><Icon name="history" className="h-4 w-4" /></span><div><h3 className="text-xl">Movement history</h3><p className="text-xs text-ink-soft">Every place this item has lived</p></div></div>{movementsError ? <p className="mt-4 text-sm text-red-700">Unable to load movement history.</p> : itemMovements.length ? <div className="mt-5 space-y-4">{itemMovements.map(movement => <div className="relative border-l-2 border-sage pl-4" key={movement.id}><span className="absolute -left-[0.4rem] top-0.5 h-2.5 w-2.5 rounded-full bg-pine ring-4 ring-sage/40" /><p className="text-sm font-semibold">{movement.fromRoomName} / {movement.fromLocationName} <span className="font-normal text-stone-400">to</span> {movement.toRoomName} / {movement.toLocationName}</p><p className="mt-1 text-xs text-stone-400">{activityDate.format(new Date(movement.movedAt))}</p></div>)}</div> : <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm leading-relaxed text-ink-soft">No moves recorded. This item has stayed here since it was added.</p>}</section>
        <div className="flex flex-col gap-2 sm:flex-row"><Link to={`/items/${item.id}/edit`} className="btn-secondary flex-1"><Icon name="edit" className="h-4 w-4" />Edit item</Link><button type="button" className="btn-danger flex-1" onClick={() => setShowDeleteConfirmation(true)}><Icon name="trash" className="h-4 w-4" />Delete</button></div>
      </div>
    </aside>
    {showDeleteConfirmation && <ConfirmationModal title={`Delete “${item.name}”?`} description="This item and its inventory record will be permanently deleted. This action cannot be undone." onClose={() => setShowDeleteConfirmation(false)} onConfirm={remove} />}
  </>
}

function RoomCard({ room, selected, onClick }: { room: Room; selected: boolean; onClick: () => void }) {
  const color = getSpaceColor(room.color, defaultRoomColor)
  return <button type="button" className={`group overflow-hidden rounded-2xl border bg-surface text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-soft ${selected ? 'border-pine ring-2 ring-pine/10' : 'border-line'}`} onClick={onClick} aria-pressed={selected}>
    <div className="flex h-20 items-start justify-between p-4" style={{ backgroundColor: withColorAlpha(color, '24') }}><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/75 text-pine"><Icon name="home" className="h-4 w-4" /></span><span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-stone-600">{room.itemCount} {room.itemCount === 1 ? 'item' : 'items'}</span></div>
    <div className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><h3 className="truncate text-lg group-hover:text-pine">{room.name}</h3><p className="mt-1 text-sm text-ink-soft">{selected ? 'Viewing locations' : 'See what is stored here'}</p></div><Icon name="arrow-right" className={`h-5 w-5 shrink-0 text-stone-400 transition group-hover:translate-x-1 group-hover:text-pine ${selected ? 'text-pine' : ''}`} /></div>
  </button>
}

function LocationCard({ location, selected, onClick }: { location: StorageLocation; selected: boolean; onClick: () => void }) {
  const color = getSpaceColor(location.color, defaultLocationColor)
  return <button type="button" className={`group flex min-h-28 items-start gap-3 rounded-2xl border bg-surface p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-soft ${selected ? 'border-pine ring-2 ring-pine/10' : 'border-line'}`} onClick={onClick} aria-pressed={selected}>
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: withColorAlpha(color, '24'), color }}><Icon name="map" className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate font-bold group-hover:text-pine">{location.name}</span><span className="mt-1 block text-sm text-ink-soft">{location.itemCount} {location.itemCount === 1 ? 'item' : 'items'}</span>{location.description && <span className="mt-2 block line-clamp-2 text-xs text-stone-400">{location.description}</span>}</span><Icon name="arrow-right" className="mt-1 h-4 w-4 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-pine" />
  </button>
}

function RoomLocationsModal({ room, locations, onClose, onSelectLocation }: { room: Room; locations: StorageLocation[]; onClose: () => void; onSelectLocation: (locationId: number) => void }) {
  return <div className="fixed inset-0 z-30 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-line bg-surface p-5 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="room-locations-title">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0"><h2 id="room-locations-title" className="text-2xl">Locations in {room.name}</h2><p className="mt-1 text-sm text-ink-soft">Choose a location to see the items stored there.</p></div>
        <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-stone-400 hover:bg-cream hover:text-ink" aria-label="Close room locations" onClick={onClose}><Icon name="x" className="h-5 w-5" /></button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">{locations.map(location => <LocationCard key={location.id} location={location} selected={false} onClick={() => onSelectLocation(location.id)} />)}{!locations.length && <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center sm:col-span-2"><p className="font-semibold">No locations in this room yet.</p><p className="mt-1 text-sm text-ink-soft">Add a location to start putting items here.</p></div>}</div>
      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between"><Link to={`/rooms?roomId=${room.id}#location-form`} className="btn-secondary"><Icon name="plus" className="h-4 w-4" />Add a location</Link><button type="button" className="btn-primary" onClick={onClose}>Back to rooms</button></div>
    </section>
  </div>
}

function CompactItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  return <button type="button" className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:border-pine/30 hover:shadow-soft sm:p-4" onClick={onClick}>
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-coral/10 text-[#a64d39]"><Icon name="box" className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate font-bold group-hover:text-pine">{item.name}</span><span className="mt-1 block truncate text-sm text-ink-soft">Added to {item.roomName} / {item.storageLocationName}</span></span><span className="hidden shrink-0 text-right text-xs font-semibold text-stone-400 sm:block">{activityDate.format(new Date(item.createdAt))}</span><Icon name="arrow-right" className="h-4 w-4 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-pine" />
  </button>
}

export default function InventoryOverview({ dashboard, rooms, locations, categories }: InventoryOverviewProps) {
  const { data: items, error: itemsError } = useSWR<Item[]>(cacheKeys.itemList(), itemApi.list)
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showRoomLocations, setShowRoomLocations] = useState(false)

  const selectedRoom = rooms.find(room => room.id === selectedRoomId)
  const selectedLocation = locations.find(location => location.id === selectedLocationId)
  const selectedItem = items?.find(item => item.id === selectedItemId)
  const roomLocations = locations.filter(location => location.roomId === selectedRoomId)
  const locationItems = items?.filter(item => item.storageLocationId === selectedLocationId) ?? []
  const loadError = itemsError

  function chooseRoom(roomId: number) {
    setSelectedRoomId(roomId)
    setSelectedLocationId(null)
    setSelectedItemId(null)
    setShowRoomLocations(true)
  }

  function chooseLocation(locationId: number) {
    setSelectedLocationId(locationId)
    setSelectedItemId(null)
    setShowRoomLocations(false)
  }

  function handleSaved(item: Item) {
    setShowAddItem(false)
    setSelectedRoomId(item.roomId)
    setSelectedLocationId(item.storageLocationId)
    setSelectedItemId(item.id)
    setShowRoomLocations(false)
  }

  return <>
    <h1 className="sr-only">Home inventory overview</h1>
    <section aria-label="Inventory stats" className="grid gap-4 sm:grid-cols-3">
      {[{ label: 'Total items', value: dashboard.totalItems, note: 'All catalogued belongings', icon: 'box' as const }, { label: 'Rooms', value: dashboard.totalRooms, note: 'Spaces in your home', icon: 'home' as const }, { label: 'Categories', value: dashboard.totalCategories, note: 'Ways your items are grouped', icon: 'tag' as const }].map(stat => <div className="card" key={stat.label}><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-stone-500">{stat.label}</p><span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-pine"><Icon name={stat.icon} className="h-4 w-4" /></span></div><p className="mt-5 text-3xl font-bold tracking-tight">{stat.value}</p><p className="mt-1 text-xs text-ink-soft">{stat.note}</p></div>)}
    </section>

    <section className="mt-10" aria-labelledby="rooms-at-glance-title"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="rooms-at-glance-title" className="text-2xl">Rooms at a glance</h2><button type="button" className="btn-primary" onClick={() => setShowAddItem(true)}><Icon name="plus" className="h-4 w-4" />Add item</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rooms.map(room => <RoomCard key={room.id} room={room} selected={selectedRoomId === room.id} onClick={() => chooseRoom(room.id)} />)}{!rooms.length && <Link to="/rooms?setup=room#quick-add" className="card border-dashed text-center text-stone-500"><Icon name="plus" className="mx-auto h-5 w-5 text-pine" /><span className="mt-2 block">Add your first room</span></Link>}</div></section>

    {selectedRoom && showRoomLocations && <RoomLocationsModal room={selectedRoom} locations={roomLocations} onClose={() => setShowRoomLocations(false)} onSelectLocation={chooseLocation} />}

    {selectedLocation && <section className="mt-10" aria-labelledby="items-in-location-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="items-in-location-title" className="text-2xl">Items in {selectedLocation.name}</h2><p className="mt-1 text-sm text-ink-soft">{selectedRoom?.name}</p></div><button type="button" className="btn-primary" onClick={() => setShowAddItem(true)}><Icon name="plus" className="h-4 w-4" />Add an item</button></div>{loadError ? <div className="mt-5"><ErrorMessage message={loadError instanceof Error ? loadError.message : 'Unable to load items.'} /></div> : !items ? <div className="mt-5"><Loading /></div> : <div className="mt-5 grid gap-3 lg:grid-cols-2">{locationItems.map(item => <CompactItemCard key={item.id} item={item} onClick={() => setSelectedItemId(item.id)} />)}{!locationItems.length && <div className="card border-dashed text-center lg:col-span-2"><span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-sage text-pine"><Icon name="box" className="h-5 w-5" /></span><p className="mt-3 font-semibold">Nothing here yet.</p><p className="mt-1 text-sm text-ink-soft">Add the first item to {selectedLocation.name}.</p><button type="button" className="btn-primary mt-4" onClick={() => setShowAddItem(true)}><Icon name="plus" className="h-4 w-4" />Add an item</button></div>}</div>}</section>}

    {showAddItem && <AddItemModal rooms={rooms} locations={locations} categories={categories} defaultRoomId={selectedRoomId ?? undefined} defaultLocationId={selectedLocationId ?? undefined} onClose={() => setShowAddItem(false)} onSaved={handleSaved} />}
    {selectedItem && <ItemDetailDialog item={selectedItem} onClose={() => setSelectedItemId(null)} onDeleted={() => setSelectedItemId(null)} />}
  </>
}
