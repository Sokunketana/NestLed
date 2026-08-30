import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roomApi } from '../api/roomApi'
import { storageLocationApi } from '../api/storageLocationApi'
import ConfirmationModal from '../components/ConfirmationModal'
import { ErrorMessage, Loading } from '../components/PageState'
import type { Room, StorageLocation } from '../types'

type DeleteTarget = { type: 'room'; value: Room } | { type: 'location'; value: StorageLocation }

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>(); const [locations, setLocations] = useState<StorageLocation[]>([])
  const [roomForm, setRoomForm] = useState({ name: '', description: '' }); const [roomEdit, setRoomEdit] = useState<number>()
  const [locationForm, setLocationForm] = useState({ name: '', description: '', roomId: 0 }); const [locationEdit, setLocationEdit] = useState<number>()
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>()
  const [error, setError] = useState('')
  const load = () => Promise.all([roomApi.list(), storageLocationApi.list()]).then(([r,l]) => { setRooms(r); setLocations(l); window.dispatchEvent(new Event('inventory-changed')) }).catch(e => setError(e.message))
  useEffect(() => { load() }, [])
  async function saveRoom(event: FormEvent) {
    event.preventDefault(); setError('')
    try { roomEdit ? await roomApi.update(roomEdit, roomForm) : await roomApi.create(roomForm); setRoomForm({name:'',description:''}); setRoomEdit(undefined); await load() } catch(e) { setError((e as Error).message) }
  }
  async function saveLocation(event: FormEvent) {
    event.preventDefault(); setError('')
    try { locationEdit ? await storageLocationApi.update(locationEdit, locationForm) : await storageLocationApi.create(locationForm); setLocationForm({name:'',description:'',roomId:0}); setLocationEdit(undefined); await load() } catch(e) { setError((e as Error).message) }
  }
  async function removeTarget() {
    if (!deleteTarget) return
    deleteTarget.type === 'room' ? await roomApi.remove(deleteTarget.value.id) : await storageLocationApi.remove(deleteTarget.value.id)
    await load()
    setDeleteTarget(undefined)
  }
  if (!rooms) return <Loading />
  return <>
    <div><p className="eyebrow">Organize your home</p><h1 className="mt-2 text-4xl">Rooms & storage</h1><p className="mt-2 text-stone-500">Rooms contain storage locations; both help describe an item's path.</p></div>
    {error && <div className="mt-6"><ErrorMessage message={error} /></div>}
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="space-y-4">{rooms.map(room => <article className="card" key={room.id}>
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl">{room.name}</h2><p className="mt-1 text-sm text-stone-500">{room.description || 'No description'} · <Link className="text-pine" to={`/items?roomId=${room.id}`}>{room.itemCount} items</Link></p></div>
          <div className="flex gap-1"><button className="btn-secondary px-3 py-2" onClick={() => { setRoomEdit(room.id); setRoomForm({name:room.name,description:room.description ?? ''}) }}>Edit</button><button className="btn-danger px-3 py-2" onClick={() => setDeleteTarget({type:'room',value:room})}>Delete</button></div></div>
        <div className="mt-4 flex flex-wrap gap-2">{locations.filter(l => l.roomId === room.id).map(location => <div className="group flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-sm" key={location.id}><span>{location.name} · {location.itemCount}</span><button aria-label={`Edit ${location.name}`} className="text-pine" onClick={() => { setLocationEdit(location.id); setLocationForm({name:location.name,description:location.description ?? '',roomId:location.roomId}) }}>✎</button><button aria-label={`Delete ${location.name}`} className="text-red-600" onClick={() => setDeleteTarget({type:'location',value:location})}>×</button></div>)}
          {!locations.some(l => l.roomId === room.id) && <span className="text-sm text-stone-400">No storage locations yet</span>}</div>
      </article>)}{!rooms.length && <div className="card text-center text-stone-500">Create your first room using the form.</div>}</section>
      <aside className="space-y-5">
        <form className="card" onSubmit={saveRoom}><h2 className="text-xl">{roomEdit ? 'Edit room' : 'Add a room'}</h2><div className="mt-4"><label className="label">Name *</label><input className="field" required maxLength={100} value={roomForm.name} onChange={e => setRoomForm({...roomForm,name:e.target.value})} placeholder="Bedroom" /></div><div className="mt-3"><label className="label">Description</label><textarea className="field" maxLength={500} value={roomForm.description} onChange={e => setRoomForm({...roomForm,description:e.target.value})} /></div><div className="mt-4 flex gap-2"><button className="btn-primary">{roomEdit ? 'Save room' : 'Add room'}</button>{roomEdit && <button type="button" className="btn-secondary" onClick={() => {setRoomEdit(undefined);setRoomForm({name:'',description:''})}}>Cancel</button>}</div></form>
        <form className="card" onSubmit={saveLocation}><h2 className="text-xl">{locationEdit ? 'Edit location' : 'Add storage location'}</h2><div className="mt-4"><label className="label">Room *</label><select className="field" required value={locationForm.roomId || ''} onChange={e => setLocationForm({...locationForm,roomId:Number(e.target.value)})}><option value="">Select room</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div><div className="mt-3"><label className="label">Name *</label><input className="field" required maxLength={100} value={locationForm.name} onChange={e => setLocationForm({...locationForm,name:e.target.value})} placeholder="Top drawer" /></div><div className="mt-3"><label className="label">Description</label><textarea className="field" maxLength={500} value={locationForm.description} onChange={e => setLocationForm({...locationForm,description:e.target.value})} /></div><div className="mt-4 flex gap-2"><button className="btn-primary" disabled={!rooms.length}>{locationEdit ? 'Save location' : 'Add location'}</button>{locationEdit && <button type="button" className="btn-secondary" onClick={() => {setLocationEdit(undefined);setLocationForm({name:'',description:'',roomId:0})}}>Cancel</button>}</div></form>
      </aside>
    </div>
    {deleteTarget && <ConfirmationModal
      title={`Delete “${deleteTarget.value.name}”?`}
      description={deleteTarget.type === 'room'
        ? 'This room can only be deleted when it contains no storage locations or items.'
        : 'This storage location can only be deleted when it contains no items.'}
      onClose={() => setDeleteTarget(undefined)}
      onConfirm={removeTarget}
    />}
  </>
}
