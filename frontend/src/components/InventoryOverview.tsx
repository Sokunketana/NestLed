import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import { cacheKeys, revalidateInventory } from '../api/cache'
import { itemApi } from '../api/itemApi'
import { ErrorMessage, Loading } from './PageState'
import AddSpaceModal from './AddSpaceModal'
import Icon from './Icon'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb'
import type { Category, Dashboard, Item, ItemCondition, ItemPayload, Room, StorageLocation } from '../types'
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

function RoomCard({ room, onClick }: { room: Room; onClick: () => void }) {
  const color = getSpaceColor(room.color, defaultRoomColor)
  return <button type="button" className="group overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-soft" onClick={onClick}>
    <div className="flex h-20 items-start justify-between p-4" style={{ backgroundColor: withColorAlpha(color, '24') }}><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/75 text-pine"><Icon name="home" className="h-4 w-4" /></span><span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-stone-600">{room.itemCount} {room.itemCount === 1 ? 'item' : 'items'}</span></div>
    <div className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><h3 className="truncate text-lg group-hover:text-pine">{room.name}</h3><p className="mt-1 text-sm text-ink-soft">See locations</p></div><Icon name="arrow-right" className="h-5 w-5 shrink-0 text-stone-400 transition group-hover:translate-x-1 group-hover:text-pine" /></div>
  </button>
}

function LocationCard({ location, onClick }: { location: StorageLocation; onClick: () => void }) {
  const color = getSpaceColor(location.color, defaultLocationColor)
  return <button type="button" className="group overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-soft" onClick={onClick}>
    <span className="flex h-20 items-start justify-between p-4" style={{ backgroundColor: withColorAlpha(color, '24') }}><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/75" style={{ color }}><Icon name="map" className="h-4 w-4" /></span><span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-stone-600">{location.itemCount} {location.itemCount === 1 ? 'item' : 'items'}</span></span>
    <span className="flex items-center justify-between gap-3 p-4"><span className="min-w-0"><span className="block truncate font-serif text-lg font-bold group-hover:text-pine">{location.name}</span><span className="mt-1 block text-sm text-ink-soft">See items</span></span><Icon name="arrow-right" className="h-5 w-5 shrink-0 text-stone-400 transition group-hover:translate-x-1 group-hover:text-pine" /></span>
  </button>
}

function CompactItemCard({ item }: { item: Item }) {
  return <Link to={`/items/${item.id}`} className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:border-pine/30 hover:shadow-soft sm:p-4">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-coral/10 text-[#a64d39]"><Icon name="box" className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate font-bold group-hover:text-pine">{item.name}</span><span className="mt-1 block truncate text-sm text-ink-soft">{item.categoryName} · Quantity {item.quantity}</span></span><span className="hidden shrink-0 text-right text-xs font-semibold text-stone-400 sm:block">{activityDate.format(new Date(item.createdAt))}</span><Icon name="arrow-right" className="h-4 w-4 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-pine" />
  </Link>
}

export default function InventoryOverview({ dashboard, rooms, locations, categories }: InventoryOverviewProps) {
  const { data: items, error: itemsError } = useSWR<Item[]>(cacheKeys.itemList(), itemApi.list)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddSpace, setShowAddSpace] = useState<'room' | 'location' | null>(null)

  const selectedRoom = rooms.find(room => room.id === Number(searchParams.get('roomId')))
  const selectedLocation = selectedRoom && locations.find(location => location.id === Number(searchParams.get('locationId')) && location.roomId === selectedRoom.id)
  const roomLocations = locations.filter(location => location.roomId === selectedRoom?.id)
  const locationItems = items?.filter(item => item.storageLocationId === selectedLocation?.id) ?? []

  function chooseRoom(roomId: number) {
    setSearchParams({ roomId: String(roomId) })
  }

  function chooseLocation(locationId: number) {
    if (selectedRoom) setSearchParams({ roomId: String(selectedRoom.id), locationId: String(locationId) })
  }

  function handleSaved(item: Item) {
    setShowAddItem(false)
    navigate(`/items/${item.id}`)
  }

  function handleSpaceSaved(space: Room | StorageLocation) {
    if (showAddSpace === 'room') chooseRoom(space.id)
    else chooseLocation(space.id)
    setShowAddSpace(null)
  }

  return <>
    <h1 className="sr-only">Home inventory overview</h1>
    <section aria-label="Inventory stats" className="grid gap-4 sm:grid-cols-3">
      {[{ label: 'Total items', value: dashboard.totalItems, note: 'All catalogued belongings', icon: 'box' as const }, { label: 'Rooms', value: dashboard.totalRooms, note: 'Spaces in your home', icon: 'home' as const }, { label: 'Categories', value: dashboard.totalCategories, note: 'Ways your items are grouped', icon: 'tag' as const }].map(stat => <div className="card" key={stat.label}><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-stone-500">{stat.label}</p><span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-pine"><Icon name={stat.icon} className="h-4 w-4" /></span></div><p className="mt-5 text-3xl font-bold tracking-tight">{stat.value}</p><p className="mt-1 text-xs text-ink-soft">{stat.note}</p></div>)}
    </section>

    <section className="mt-3" aria-labelledby="inventory-level-title">
      <Breadcrumb className="mb-2">
        <BreadcrumbList className="min-h-5 flex-nowrap overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <BreadcrumbItem>{selectedRoom ? <BreadcrumbLink to="/">Rooms</BreadcrumbLink> : <BreadcrumbPage>Rooms</BreadcrumbPage>}</BreadcrumbItem>
          {selectedRoom && <><BreadcrumbSeparator /><BreadcrumbItem>{selectedLocation ? <BreadcrumbLink to={`/?roomId=${selectedRoom.id}`}>{selectedRoom.name}</BreadcrumbLink> : <BreadcrumbPage>{selectedRoom.name}</BreadcrumbPage>}</BreadcrumbItem></>}
          {selectedLocation && <><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{selectedLocation.name}</BreadcrumbPage></BreadcrumbItem></>}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="inventory-level-title" className="min-w-0 text-2xl">{selectedLocation ? `Items in ${selectedLocation.name}` : selectedRoom ? `Locations in ${selectedRoom.name}` : 'Rooms'}</h2>
        <button type="button" className="btn-primary" onClick={() => selectedLocation ? setShowAddItem(true) : setShowAddSpace(selectedRoom ? 'location' : 'room')}><Icon name="plus" className="h-4 w-4" />Add {selectedLocation ? 'item' : selectedRoom ? 'location' : 'room'}</button>
      </div>

      {selectedLocation ? itemsError ? <div className="mt-5"><ErrorMessage message={itemsError instanceof Error ? itemsError.message : 'Unable to load items.'} /></div> : !items ? <div className="mt-5"><Loading /></div> : <div className="mt-5 grid gap-3 lg:grid-cols-2">{locationItems.map(item => <CompactItemCard key={item.id} item={item} />)}{!locationItems.length && <div className="card border-dashed text-center lg:col-span-2"><span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-sage text-pine"><Icon name="box" className="h-5 w-5" /></span><p className="mt-3 font-semibold">Nothing here yet.</p><p className="mt-1 text-sm text-ink-soft">Add the first item to {selectedLocation.name}.</p><button type="button" className="btn-primary mt-4" onClick={() => setShowAddItem(true)}><Icon name="plus" className="h-4 w-4" />Add an item</button></div>}</div>
        : selectedRoom ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{roomLocations.map(location => <LocationCard key={location.id} location={location} onClick={() => chooseLocation(location.id)} />)}{!roomLocations.length && <button type="button" onClick={() => setShowAddSpace('location')} className="card border-dashed text-center text-stone-500"><Icon name="plus" className="mx-auto h-5 w-5 text-pine" /><span className="mt-2 block">Add the first location in {selectedRoom.name}</span></button>}</div>
          : <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rooms.map(room => <RoomCard key={room.id} room={room} onClick={() => chooseRoom(room.id)} />)}{!rooms.length && <button type="button" onClick={() => setShowAddSpace('room')} className="card border-dashed text-center text-stone-500"><Icon name="plus" className="mx-auto h-5 w-5 text-pine" /><span className="mt-2 block">Add your first room</span></button>}</div>}
    </section>

    {showAddItem && <AddItemModal rooms={rooms} locations={locations} categories={categories} defaultRoomId={selectedRoom?.id} defaultLocationId={selectedLocation?.id} onClose={() => setShowAddItem(false)} onSaved={handleSaved} />}
    {showAddSpace && <AddSpaceModal mode={showAddSpace} room={showAddSpace === 'location' ? selectedRoom : undefined} onClose={() => setShowAddSpace(null)} onSaved={handleSpaceSaved} />}
  </>
}
