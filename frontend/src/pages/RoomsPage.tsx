import { FormEvent, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import { roomApi } from '../api/roomApi'
import { storageLocationApi } from '../api/storageLocationApi'
import { cacheKeys, revalidateInventory } from '../api/cache'
import ConfirmationModal from '../components/ConfirmationModal'
import Icon from '../components/Icon'
import { ErrorMessage, Loading } from '../components/PageState'
import SpaceEditModal, { SpaceEditForm, SpaceEditTarget } from '../components/SpaceEditModal'
import SpaceColorPicker from '../components/SpaceColorPicker'
import SpaceActionsMenu from '../components/SpaceActionsMenu'
import { ApiRequestError } from '../api/http'
import type { Room, StorageLocation } from '../types'
import { defaultLocationColor, defaultRoomColor, getSpaceColor, withColorAlpha } from '../spaceColors'

type AddMode = 'room' | 'location'
type DeleteTarget = { type: 'room'; value: Room } | { type: 'location'; value: StorageLocation }
const roomDeleteConflictMessage = 'This room cannot be deleted while it contains items or storage locations. Move or delete the items, then delete the storage locations first.'

export default function RoomsPage() {
  const [searchParams] = useSearchParams()
  const setupMode = searchParams.get('setup')
  const { data: rooms, error: roomsError } = useSWR<Room[]>(cacheKeys.rooms, roomApi.list)
  const { data: locations, error: locationsError } = useSWR<StorageLocation[]>(cacheKeys.locations, storageLocationApi.list)
  const [addMode, setAddMode] = useState<AddMode>(setupMode === 'location' ? 'location' : 'room')
  const [roomForm, setRoomForm] = useState({ name: '', description: '', color: defaultRoomColor })
  const [locationForm, setLocationForm] = useState({ name: '', description: '', color: defaultLocationColor, roomId: 0 })
  const [editingTarget, setEditingTarget] = useState<SpaceEditTarget>()
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>()
  const [error, setError] = useState('')

  const locationList = locations ?? []
  const loadError = roomsError || locationsError
  const totalItems = (rooms ?? []).reduce((sum, room) => sum + room.itemCount, 0)

  useEffect(() => {
    if (setupMode === 'location') {
      setAddMode('location')
      if (rooms?.[0]) setLocationForm(current => ({ ...current, roomId: current.roomId || rooms[0].id }))
      requestAnimationFrame(() => document.getElementById('quick-add')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
    }
  }, [rooms, setupMode])

  async function refreshInventory() {
    await revalidateInventory({ dashboard: true, itemDetails: true, items: true, locations: true, movements: true, rooms: true })
  }

  function showQuickAdd(mode: AddMode, roomId?: number) {
    setAddMode(mode)
    if (mode === 'location' && roomId) {
      setLocationForm(current => ({ ...current, roomId }))
    } else if (mode === 'location' && !locationForm.roomId && rooms?.[0]) {
      setLocationForm(current => ({ ...current, roomId: rooms[0].id }))
    }
    requestAnimationFrame(() => document.getElementById('quick-add')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }

  async function saveRoom(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await roomApi.create(roomForm)
      setRoomForm({ name: '', description: '', color: defaultRoomColor })
      await refreshInventory()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save room.')
    }
  }

  async function saveLocation(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await storageLocationApi.create(locationForm)
      setLocationForm({ name: '', description: '', color: defaultLocationColor, roomId: locationForm.roomId })
      await refreshInventory()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save storage location.')
    }
  }

  async function removeTarget() {
    if (!deleteTarget) return
      const target = deleteTarget
    try {
      if (target.type === 'room') await roomApi.remove(target.value.id)
      else await storageLocationApi.remove(target.value.id)
    } catch (cause) {
      if (target.type === 'room' && cause instanceof ApiRequestError && cause.status === 409) {
        throw new Error(roomDeleteConflictMessage, { cause })
      }
      throw cause
    }
    await refreshInventory()
    setDeleteTarget(undefined)
  }

  async function saveEdit(form: SpaceEditForm) {
    if (!editingTarget) return

    if (editingTarget.type === 'room') {
      await roomApi.update(editingTarget.value.id, { name: form.name, description: form.description, color: form.color })
    } else {
      if (!form.roomId) throw new Error('Select a room before saving the storage location.')
      await storageLocationApi.update(editingTarget.value.id, {
        name: form.name,
        description: form.description,
        color: form.color,
        roomId: form.roomId,
      })
    }

    await refreshInventory()
  }

  if (!rooms && loadError) return <ErrorMessage message={loadError instanceof Error ? loadError.message : 'Unable to load rooms.'} />
  if (!rooms) return <Loading />

  return <>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="page-title">Rooms & locations</h1>
        <p className="mt-2 max-w-2xl text-stone-500">A simple map of the rooms and the places where your things live.</p>
        <p className="mt-3 text-sm font-semibold text-ink-soft">{rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} <span className="mx-1.5 text-stone-300">·</span> {locationList.length} {locationList.length === 1 ? 'location' : 'locations'} <span className="mx-1.5 text-stone-300">·</span> {totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
      </div>
      <button type="button" className="btn-primary" onClick={() => showQuickAdd('room')}><Icon name="plus" className="h-4 w-4" />Add room</button>
    </div>
    {(error || loadError) && <div className="mt-6"><ErrorMessage message={error || (loadError instanceof Error ? loadError.message : 'Unable to load rooms.')} /></div>}

    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="card p-0" aria-label="Rooms and storage locations">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-5 sm:px-6">
          <div><h2 className="text-2xl">Rooms</h2></div>
          <button type="button" className="inline-flex items-center gap-1.5 text-sm font-bold text-pine hover:text-deep" onClick={() => showQuickAdd('location')}>
            <Icon name="plus" className="h-4 w-4" />Add location
          </button>
        </div>

        <div className="divide-y divide-line">
          {rooms.map(room => {
            const roomLocations = locationList.filter(location => location.roomId === room.id)
            const roomColor = getSpaceColor(room.color, defaultRoomColor)

            return <article className="relative" key={room.id}>
              <div className="h-1.5" style={{ backgroundColor: withColorAlpha(roomColor, '35') }} aria-hidden="true" />
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl">{room.name}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{room.itemCount} {room.itemCount === 1 ? 'item' : 'items'} across {roomLocations.length} {roomLocations.length === 1 ? 'location' : 'locations'}</p>
                  </div>
                  <SpaceActionsMenu name={room.name} onEdit={() => setEditingTarget({ type: 'room', value: room })} onDelete={() => setDeleteTarget({ type: 'room', value: room })} />
                </div>
                {room.description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">{room.description}</p>}

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {roomLocations.map(location => {
                    const locationColor = getSpaceColor(location.color, defaultLocationColor)
                    return <div className="group flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2" style={{ backgroundColor: withColorAlpha(locationColor, '0D'), borderColor: withColorAlpha(locationColor, '33') }} key={location.id}>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: locationColor }} aria-hidden="true" />
                      <Link to={`/items?roomId=${room.id}&storageLocationId=${location.id}`} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-0.5 text-sm font-semibold hover:text-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/30">
                        <span className="min-w-0 flex-1 truncate">{location.name}</span>
                        <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-ink-soft ring-1 ring-black/5" aria-label={`${location.itemCount} ${location.itemCount === 1 ? 'item' : 'items'}`}>{location.itemCount}</span>
                        <Icon name="chevron-right" className="h-3.5 w-3.5 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-pine" />
                      </Link>
                      <SpaceActionsMenu name={location.name} onEdit={() => setEditingTarget({ type: 'location', value: location })} onDelete={() => setDeleteTarget({ type: 'location', value: location })} />
                    </div>
                  })}
                  {!roomLocations.length && <button type="button" className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-left text-sm text-stone-400 transition hover:border-pine/40 hover:bg-mint hover:text-pine" onClick={() => showQuickAdd('location', room.id)}>
                    <Icon name="plus" className="h-4 w-4" />Add the first location
                  </button>}
                </div>
              </div>
            </article>
          })}
          {!rooms.length && <div className="px-5 py-14 text-center sm:px-6"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sage text-pine"><Icon name="home" className="h-6 w-6" /></span><p className="mt-4 font-semibold">Your home is ready for its first room.</p><p className="mt-1 text-sm text-ink-soft">Add a room, then place storage locations inside it.</p><button type="button" className="btn-primary mt-5" onClick={() => showQuickAdd('room')}><Icon name="plus" className="h-4 w-4" />Add room</button></div>}
        </div>
      </section>

      <section id="quick-add" className="card h-fit scroll-mt-24 xl:sticky xl:top-24">
        <div><h2 className="text-xl">Add to your map</h2><p className="mt-1 text-sm leading-relaxed text-ink-soft">Keep the setup light and focused.</p></div>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-cream p-1" role="tablist" aria-label="What would you like to add?">
          <button type="button" role="tab" aria-selected={addMode === 'room'} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${addMode === 'room' ? 'bg-white text-deep shadow-sm' : 'text-ink-soft hover:text-ink'}`} onClick={() => setAddMode('room')}>Room</button>
          <button type="button" role="tab" aria-selected={addMode === 'location'} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${addMode === 'location' ? 'bg-white text-deep shadow-sm' : 'text-ink-soft hover:text-ink'}`} onClick={() => showQuickAdd('location')}>Location</button>
        </div>

        {addMode === 'room' ? <form className="mt-5" onSubmit={saveRoom}>
          <label className="label" htmlFor="new-room-name">Room name *</label>
          <input id="new-room-name" className="field" required maxLength={100} value={roomForm.name} onChange={event => setRoomForm(current => ({ ...current, name: event.target.value }))} placeholder="Bedroom" />
          <label className="label mt-4" htmlFor="new-room-description">Description <span className="font-normal text-stone-400">(optional)</span></label>
          <input id="new-room-description" className="field" maxLength={500} value={roomForm.description} onChange={event => setRoomForm(current => ({ ...current, description: event.target.value }))} placeholder="Main bedroom" />
          <div className="mt-5"><SpaceColorPicker value={roomForm.color} onChange={color => setRoomForm(current => ({ ...current, color }))} /></div>
          <button className="btn-primary mt-5 w-full"><Icon name="plus" className="h-4 w-4" />Add room</button>
        </form> : <form className="mt-5" onSubmit={saveLocation}>
          <label className="label" htmlFor="new-location-room">Room *</label>
          <select id="new-location-room" className="field" required value={locationForm.roomId || ''} onChange={event => setLocationForm(current => ({ ...current, roomId: Number(event.target.value) }))} disabled={!rooms.length}>
            <option value="">Select room</option>
            {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
          </select>
          <label className="label mt-4" htmlFor="new-location-name">Location name *</label>
          <input id="new-location-name" className="field" required maxLength={100} value={locationForm.name} onChange={event => setLocationForm(current => ({ ...current, name: event.target.value }))} placeholder="Top drawer" />
          <label className="label mt-4" htmlFor="new-location-description">Description <span className="font-normal text-stone-400">(optional)</span></label>
          <input id="new-location-description" className="field" maxLength={500} value={locationForm.description} onChange={event => setLocationForm(current => ({ ...current, description: event.target.value }))} placeholder="Optional note" />
          <div className="mt-5"><SpaceColorPicker value={locationForm.color} onChange={color => setLocationForm(current => ({ ...current, color }))} /></div>
          {!rooms.length && <p className="mt-3 text-sm text-amber-700">Add a room first, then you can place a location inside it.</p>}
          <button className="btn-primary mt-5 w-full" disabled={!rooms.length}><Icon name="plus" className="h-4 w-4" />Add location</button>
        </form>}
      </section>
    </div>
    {editingTarget && <SpaceEditModal
      key={`${editingTarget.type}-${editingTarget.value.id}`}
      target={editingTarget}
      rooms={rooms}
      onClose={() => setEditingTarget(undefined)}
      onSave={saveEdit}
    />}
    {deleteTarget && <ConfirmationModal
      title={`Delete “${deleteTarget.value.name}”?`}
      description={deleteTarget.type === 'room' ? 'This room can only be deleted when it contains no storage locations or items.' : 'This storage location can only be deleted when it contains no items.'}
      errorMessage={deleteTarget.type === 'room' ? roomDeleteConflictMessage : undefined}
      onClose={() => setDeleteTarget(undefined)}
      onConfirm={removeTarget}
    />}
  </>
}
