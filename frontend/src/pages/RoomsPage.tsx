import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { roomApi } from '../api/roomApi'
import { storageLocationApi } from '../api/storageLocationApi'
import { cacheKeys, revalidateInventory } from '../api/cache'
import ConfirmationModal from '../components/ConfirmationModal'
import Icon from '../components/Icon'
import { ErrorMessage, Loading } from '../components/PageState'
import SpaceEditModal, { SpaceEditForm, SpaceEditTarget } from '../components/SpaceEditModal'
import type { Room, StorageLocation } from '../types'

type DeleteTarget = { type: 'room'; value: Room } | { type: 'location'; value: StorageLocation }

export default function RoomsPage() {
  const { data: rooms, error: roomsError } = useSWR<Room[]>(cacheKeys.rooms, roomApi.list)
  const { data: locations, error: locationsError } = useSWR<StorageLocation[]>(cacheKeys.locations, storageLocationApi.list)
  const [roomForm, setRoomForm] = useState({ name: '', description: '' })
  const [locationForm, setLocationForm] = useState({ name: '', description: '', roomId: 0 })
  const [editingTarget, setEditingTarget] = useState<SpaceEditTarget>()
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>()
  const [error, setError] = useState('')

  const locationList = locations ?? []
  const loadError = roomsError || locationsError

  async function refreshInventory() {
    await revalidateInventory({ dashboard: true, itemDetails: true, items: true, locations: true, rooms: true })
  }

  async function saveRoom(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await roomApi.create(roomForm)
      setRoomForm({ name: '', description: '' })
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
      setLocationForm({ name: '', description: '', roomId: 0 })
      await refreshInventory()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save storage location.')
    }
  }

  async function removeTarget() {
    if (!deleteTarget) return
    try {
      deleteTarget.type === 'room' ? await roomApi.remove(deleteTarget.value.id) : await storageLocationApi.remove(deleteTarget.value.id)
      await refreshInventory()
      setDeleteTarget(undefined)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete this entry.')
    }
  }

  async function saveEdit(form: SpaceEditForm) {
    if (!editingTarget) return

    if (editingTarget.type === 'room') {
      await roomApi.update(editingTarget.value.id, { name: form.name, description: form.description })
    } else {
      if (!form.roomId) throw new Error('Select a room before saving the storage location.')
      await storageLocationApi.update(editingTarget.value.id, {
        name: form.name,
        description: form.description,
        roomId: form.roomId,
      })
    }

    await refreshInventory()
  }

  if (!rooms && loadError) return <ErrorMessage message={loadError instanceof Error ? loadError.message : 'Unable to load rooms.'} />
  if (!rooms) return <Loading />

  return <>
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="eyebrow">Home setup</p>
        <h1 className="page-title mt-2">Rooms & storage</h1>
        <p className="mt-2 max-w-2xl text-stone-500">Create a simple path from each room to the places where your items live.</p>
      </div>
      <Link to="/items" className="btn-secondary"><Icon name="box" className="h-4 w-4" />Browse items</Link>
    </div>
    {(error || loadError) && <div className="mt-6"><ErrorMessage message={error || (loadError instanceof Error ? loadError.message : 'Unable to load rooms.')} /></div>}

    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="card" aria-label="Rooms and storage locations">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">Home map</p><h2 className="mt-2 text-2xl">Your rooms</h2></div>
          <span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-pine">{rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}</span>
        </div>

        <div className="mt-5 divide-y divide-line">
          {rooms.map(room => {
            const roomLocations = locationList.filter(location => location.roomId === room.id)
            return <article className="py-5 first:pt-1 last:pb-1" key={room.id}>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage text-pine"><Icon name="home" className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0"><h3 className="truncate text-xl">{room.name}</h3><p className="mt-0.5 text-sm text-ink-soft">{room.itemCount} {room.itemCount === 1 ? 'item' : 'items'}</p></div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" title={`Edit ${room.name}`} aria-label={`Edit ${room.name}`} className="btn-secondary h-8 w-8 p-0" onClick={() => setEditingTarget({ type: 'room', value: room })}><Icon name="edit" className="h-3.5 w-3.5" /></button>
                      <button type="button" title={`Delete ${room.name}`} aria-label={`Delete ${room.name}`} className="btn-danger h-8 w-8 p-0" onClick={() => setDeleteTarget({ type: 'room', value: room })}><Icon name="trash" className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {room.description && <p className="mt-2 text-sm text-stone-500">{room.description}</p>}
                  <div className="mt-4 space-y-2">
                    {roomLocations.map(location => <div className="flex min-w-0 items-center gap-2 rounded-xl bg-cream px-3 py-2 text-sm" key={location.id}>
                      <Icon name="map" className="h-3.5 w-3.5 shrink-0 text-pine" />
                      <Link to={`/items?roomId=${room.id}&storageLocationId=${location.id}`} className="min-w-0 flex-1 truncate font-semibold hover:text-pine">{location.name}</Link>
                      <span className="shrink-0 text-xs text-stone-500">{location.itemCount}</span>
                      <button type="button" title={`Edit ${location.name}`} aria-label={`Edit ${location.name}`} className="ml-1 shrink-0 text-pine hover:text-deep" onClick={() => setEditingTarget({ type: 'location', value: location })}><Icon name="edit" className="h-3.5 w-3.5" /></button>
                      <button type="button" title={`Delete ${location.name}`} aria-label={`Delete ${location.name}`} className="shrink-0 text-red-600 hover:text-red-800" onClick={() => setDeleteTarget({ type: 'location', value: location })}><Icon name="x" className="h-3.5 w-3.5" /></button>
                    </div>)}
                    {!roomLocations.length && <p className="rounded-xl border border-dashed border-line px-3 py-2 text-sm text-stone-400">No storage locations yet</p>}
                  </div>
                </div>
              </div>
            </article>
          })}
          {!rooms.length && <div className="border border-dashed border-line px-4 py-12 text-center"><Icon name="home" className="mx-auto h-7 w-7 text-pine" /><p className="mt-3 font-semibold">Your home is ready for its first room.</p><p className="mt-1 text-sm text-ink-soft">Add a room, then place storage locations inside it.</p></div>}
        </div>
      </section>

      <details className="card group" open>
        <summary className="flex cursor-pointer list-none items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-coral/10 text-coral"><Icon name="plus" className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-xl">Add to your home</span><span className="mt-1 block text-sm text-ink-soft">Set up rooms and storage locations.</span></span>
          <Icon name="chevron-down" className="h-5 w-5 shrink-0 text-stone-400 transition group-open:rotate-180" />
        </summary>
        <div className="mt-6 space-y-6">
          <form onSubmit={saveRoom}>
            <h3 className="text-lg">New room</h3>
            <div className="mt-4"><label className="label">Name *</label><input className="field" required maxLength={100} value={roomForm.name} onChange={event => setRoomForm({ ...roomForm, name: event.target.value })} placeholder="Bedroom" /></div>
            <div className="mt-3"><label className="label">Description</label><textarea className="field min-h-20" maxLength={500} value={roomForm.description} onChange={event => setRoomForm({ ...roomForm, description: event.target.value })} placeholder="Optional note" /></div>
            <button className="btn-primary mt-4"><Icon name="plus" className="h-4 w-4" />Add room</button>
          </form>

          <form className="border-t border-line pt-6" onSubmit={saveLocation}>
            <h3 className="text-lg">New storage location</h3>
            <div className="mt-4"><label className="label">Room *</label><select className="field" required value={locationForm.roomId || ''} onChange={event => setLocationForm({ ...locationForm, roomId: Number(event.target.value) })}><option value="">Select room</option>{rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</select></div>
            <div className="mt-3"><label className="label">Name *</label><input className="field" required maxLength={100} value={locationForm.name} onChange={event => setLocationForm({ ...locationForm, name: event.target.value })} placeholder="Top drawer" /></div>
            <div className="mt-3"><label className="label">Description</label><textarea className="field min-h-20" maxLength={500} value={locationForm.description} onChange={event => setLocationForm({ ...locationForm, description: event.target.value })} placeholder="Optional note" /></div>
            <button className="btn-primary mt-4" disabled={!rooms.length}><Icon name="plus" className="h-4 w-4" />Add location</button>
          </form>
        </div>
      </details>
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
      onClose={() => setDeleteTarget(undefined)}
      onConfirm={removeTarget}
    />}
  </>
}
