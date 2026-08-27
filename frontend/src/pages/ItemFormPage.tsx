import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { categoryApi } from '../api/categoryApi'
import { itemApi } from '../api/itemApi'
import { roomApi } from '../api/roomApi'
import { storageLocationApi } from '../api/storageLocationApi'
import { ErrorMessage, Loading } from '../components/PageState'
import type { Category, ItemCondition, ItemPayload, Room, StorageLocation } from '../types'

const initial: ItemPayload = { name: '', description: '', quantity: 1, categoryId: 0, roomId: 0,
  storageLocationId: undefined, estimatedValue: undefined, purchaseDate: undefined,
  warrantyExpirationDate: undefined, condition: 'GOOD', notes: '' }

export default function ItemFormPage() {
  const { id } = useParams(); const editing = Boolean(id); const navigate = useNavigate()
  const [form, setForm] = useState<ItemPayload>(initial)
  const [rooms, setRooms] = useState<Room[]>([]); const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<StorageLocation[]>([]); const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([roomApi.list(), categoryApi.list(), editing ? itemApi.get(Number(id)) : Promise.resolve(null)])
      .then(([r,c,item]) => { setRooms(r); setCategories(c); if (item) setForm({ name:item.name, description:item.description, quantity:item.quantity, categoryId:item.categoryId, roomId:item.roomId, storageLocationId:item.storageLocationId, estimatedValue:item.estimatedValue ?? undefined, purchaseDate:item.purchaseDate, warrantyExpirationDate:item.warrantyExpirationDate, condition:item.condition, notes:item.notes }); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [editing, id])
  useEffect(() => { if (form.roomId) storageLocationApi.byRoom(form.roomId).then(setLocations).catch(() => setLocations([])); else setLocations([]) }, [form.roomId])
  function set<K extends keyof ItemPayload>(key: K, value: ItemPayload[K]) { setForm(old => ({ ...old, [key]: value })) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    const payload = { ...form, storageLocationId: form.storageLocationId || undefined,
      purchaseDate: form.purchaseDate || undefined, warrantyExpirationDate: form.warrantyExpirationDate || undefined }
    try { const saved = editing ? await itemApi.update(Number(id), payload) : await itemApi.create(payload); navigate(`/items/${saved.id}`) }
    catch (e) { setError((e as Error).message); setSaving(false) }
  }
  if (loading) return <Loading />
  return <>
    <Link to={editing ? `/items/${id}` : '/items'} className="text-sm font-semibold text-pine">← Cancel</Link>
    <div className="mt-5"><p className="eyebrow">{editing ? 'Update record' : 'New record'}</p><h1 className="mt-2 text-4xl">{editing ? 'Edit item' : 'Add an item'}</h1><p className="mt-2 text-stone-500">Record what it is, what it is worth, and exactly where it lives.</p></div>
    {!rooms.length || !categories.length ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">Create at least one <Link className="underline" to="/rooms">room</Link> and <Link className="underline" to="/categories">category</Link> before adding an item.</div> : null}
    <form onSubmit={submit} className="mt-8 space-y-6">
      {error && <ErrorMessage message={error} />}
      <section className="card grid gap-5 md:grid-cols-2"><div className="md:col-span-2"><label className="label">Item name *</label><input className="field" required maxLength={150} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Passport" /></div>
        <div className="md:col-span-2"><label className="label">Description</label><textarea className="field min-h-24" maxLength={1000} value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Helpful identifying details" /></div>
        <div><label className="label">Quantity *</label><input className="field" type="number" required min="1" value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} /></div>
        <div><label className="label">Condition *</label><select className="field" value={form.condition} onChange={e => set('condition', e.target.value as ItemCondition)}>{['NEW','GOOD','FAIR','DAMAGED'].map(x => <option key={x}>{x}</option>)}</select></div>
      </section>
      <section className="card"><h2 className="mb-5 text-xl">Where is it?</h2><div className="grid gap-5 md:grid-cols-3">
        <div><label className="label">Room *</label><select className="field" required value={form.roomId || ''} onChange={e => { set('roomId', Number(e.target.value)); set('storageLocationId', undefined) }}><option value="">Select room</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
        <div><label className="label">Storage location</label><select className="field" value={form.storageLocationId ?? ''} onChange={e => set('storageLocationId', e.target.value ? Number(e.target.value) : undefined)} disabled={!form.roomId}><option value="">No specific location</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
        <div><label className="label">Category *</label><select className="field" required value={form.categoryId || ''} onChange={e => set('categoryId', Number(e.target.value))}><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </div></section>
      <section className="card"><h2 className="mb-5 text-xl">Value & dates</h2><div className="grid gap-5 md:grid-cols-3">
        <div><label className="label">Estimated value each</label><input className="field" type="number" min="0" step="0.01" value={form.estimatedValue ?? ''} onChange={e => set('estimatedValue', e.target.value === '' ? undefined : Number(e.target.value))} /></div>
        <div><label className="label">Purchase date</label><input className="field" type="date" value={form.purchaseDate ?? ''} onChange={e => set('purchaseDate', e.target.value || undefined)} /></div>
        <div><label className="label">Warranty expiration</label><input className="field" type="date" value={form.warrantyExpirationDate ?? ''} onChange={e => set('warrantyExpirationDate', e.target.value || undefined)} /></div>
        <div className="md:col-span-3"><label className="label">Notes</label><textarea className="field min-h-24" maxLength={2000} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Serial number, warranty details, or anything else useful" /></div>
      </div></section>
      <div className="flex justify-end gap-3"><Link to={editing ? `/items/${id}` : '/items'} className="btn-secondary">Cancel</Link><button className="btn-primary" disabled={saving || !rooms.length || !categories.length}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add item'}</button></div>
    </form>
  </>
}
