import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roomApi } from '../api/roomApi'
import { storageLocationApi } from '../api/storageLocationApi'
import ConfirmationModal from '../components/ConfirmationModal'
import Icon from '../components/Icon'
import { ErrorMessage, Loading } from '../components/PageState'
import SpaceEditModal, { SpaceEditForm, SpaceEditTarget } from '../components/SpaceEditModal'
import type { Room, StorageLocation } from '../types'

type DeleteTarget = { type: 'room'; value: Room } | { type: 'location'; value: StorageLocation }

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>()
  const [locations, setLocations] = useState<StorageLocation[]>([])
  const [roomForm, setRoomForm] = useState({ name: '', description: '' })
  const [locationForm, setLocationForm] = useState({ name: '', description: '', roomId: 0 })
  const [editingTarget, setEditingTarget] = useState<SpaceEditTarget>()
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>()
  const [error, setError] = useState('')

  const load = () => Promise.all([roomApi.list(), storageLocationApi.list()])
    .then(([nextRooms, nextLocations]) => {
      setRooms(nextRooms)
      setLocations(nextLocations)
      window.dispatchEvent(new Event('inventory-changed'))
    })

  useEffect(() => {
    void load().catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load rooms.'))
  }, [])

  async function saveRoom(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await roomApi.create(roomForm)
      setRoomForm({ name: '', description: '' })
      await load()
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
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save storage location.')
    }
  }

  async function removeTarget() {
    if (!deleteTarget) return
    try {
      deleteTarget.type === 'room' ? await roomApi.remove(deleteTarget.value.id) : await storageLocationApi.remove(deleteTarget.value.id)
      await load()
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

    await load()
  }

  if (!rooms) return <Loading />

  return <>
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="eyebrow">Organize your home</p>
        <h1 className="page-title mt-2">Rooms & storage</h1>
        <p className="mt-2 max-w-2xl text-stone-500">Give every belonging a clear path from room to storage location.</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-full bg-sage px-3.5 py-2 text-sm font-bold text-pine"><Icon name="map" className="h-4 w-4" />{rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}</div>
    </div>
    {error && <div className="mt-6"><ErrorMessage message={error} /></div>}

    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_24rem]">
      <section className="space-y-4" aria-label="Rooms">
        <div className="flex flex-wrap items-start justify-between gap-2 px-1 sm:items-center"><p className="text-sm font-bold text-ink">Your rooms</p><span className="text-xs text-ink-soft">Storage locations sit inside each room</span></div>
        {rooms.map((room, index) => <article className="card overflow-hidden p-0" key={room.id}>
          <div className={`flex flex-wrap items-start justify-between gap-3 border-b border-line/70 p-4 sm:gap-4 sm:p-5 ${['bg-coral/10','bg-gold/10','bg-pine/10'][index % 3]}`}>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/80 ${['text-coral','text-amber-700','text-pine'][index % 3]}`}><Icon name="home" className="h-5 w-5" /></span>
              <div className="min-w-0"><h2 className="truncate text-xl">{room.name}</h2><p className="mt-0.5 text-sm text-stone-600">{room.itemCount} {room.itemCount === 1 ? 'item' : 'items'} in this room</p></div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" title={`Edit ${room.name}`} aria-label={`Edit ${room.name}`} className="btn-secondary h-9 w-9 p-0" onClick={() => setEditingTarget({ type: 'room', value: room })}><Icon name="edit" className="h-4 w-4" /></button>
              <button type="button" title={`Delete ${room.name}`} aria-label={`Delete ${room.name}`} className="btn-danger h-9 w-9 p-0" onClick={() => setDeleteTarget({ type: 'room', value: room })}><Icon name="trash" className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-ink-soft">{room.description || 'No description yet.'} <span className="mx-1 text-stone-300">·</span> <Link className="font-semibold text-pine hover:text-deep" to={`/items?roomId=${room.id}`}>Browse items <Icon name="arrow-right" className="inline h-3.5 w-3.5" /></Link></p>
            <div className="mt-4 flex flex-wrap gap-2">
              {locations.filter(location => location.roomId === room.id).map(location => <div className="group flex max-w-full items-center gap-2 rounded-xl border border-line bg-cream px-3 py-2 text-sm" key={location.id}>
                <Icon name="map" className="h-3.5 w-3.5 shrink-0 text-pine" /><span className="min-w-0 max-w-[14rem] truncate">{location.name} <span className="text-stone-400">·</span> {location.itemCount}</span>
                <button type="button" title={`Edit ${location.name}`} aria-label={`Edit ${location.name}`} className="ml-1 text-pine hover:text-deep" onClick={() => setEditingTarget({ type: 'location', value: location })}><Icon name="edit" className="h-3.5 w-3.5" /></button>
                <button type="button" title={`Delete ${location.name}`} aria-label={`Delete ${location.name}`} className="text-red-600 hover:text-red-800" onClick={() => setDeleteTarget({ type: 'location', value: location })}><Icon name="x" className="h-3.5 w-3.5" /></button>
              </div>)}
              {!locations.some(location => location.roomId === room.id) && <span className="rounded-xl border border-dashed border-line px-3 py-2 text-sm text-stone-400">No storage locations yet</span>}
            </div>
          </div>
        </article>)}
        {!rooms.length && <div className="card border-dashed py-14 text-center"><Icon name="home" className="mx-auto h-7 w-7 text-pine" /><p className="mt-3 font-semibold">Your home is ready for its first room.</p><p className="mt-1 text-sm text-ink-soft">Use the form to create a room, then add a location inside it.</p></div>}
      </section>

      <aside className="space-y-4">
        <form className="card" onSubmit={saveRoom}>
          <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-coral/10 text-coral"><Icon name="home" className="h-4 w-4" /></span><div><h2 className="text-xl">Add a room</h2><p className="mt-1 text-sm text-ink-soft">Start with the spaces you use every day.</p></div></div>
          <div className="mt-5"><label className="label">Name *</label><input className="field" required maxLength={100} value={roomForm.name} onChange={event => setRoomForm({ ...roomForm, name: event.target.value })} placeholder="Bedroom" /></div>
          <div className="mt-3"><label className="label">Description</label><textarea className="field min-h-20" maxLength={500} value={roomForm.description} onChange={event => setRoomForm({ ...roomForm, description: event.target.value })} placeholder="A short note about this space" /></div>
          <div className="mt-4 flex gap-2"><button className="btn-primary"><Icon name="plus" className="h-4 w-4" />Add room</button></div>
        </form>

        <form className="card" onSubmit={saveLocation}>
          <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-sage text-pine"><Icon name="map" className="h-4 w-4" /></span><div><h2 className="text-xl">Add storage location</h2><p className="mt-1 text-sm text-ink-soft">Be as specific as future-you needs.</p></div></div>
          <div className="mt-5"><label className="label">Room *</label><select className="field" required value={locationForm.roomId || ''} onChange={event => setLocationForm({ ...locationForm, roomId: Number(event.target.value) })}><option value="">Select room</option>{rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</select></div>
          <div className="mt-3"><label className="label">Name *</label><input className="field" required maxLength={100} value={locationForm.name} onChange={event => setLocationForm({ ...locationForm, name: event.target.value })} placeholder="Top drawer" /></div>
          <div className="mt-3"><label className="label">Description</label><textarea className="field min-h-20" maxLength={500} value={locationForm.description} onChange={event => setLocationForm({ ...locationForm, description: event.target.value })} placeholder="Which drawer, shelf, or cabinet?" /></div>
          <div className="mt-4 flex gap-2"><button className="btn-primary" disabled={!rooms.length}><Icon name="plus" className="h-4 w-4" />Add location</button></div>
        </form>
      </aside>
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
