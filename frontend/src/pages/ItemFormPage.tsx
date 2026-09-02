import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { categoryApi } from '../api/categoryApi'
import { itemApi } from '../api/itemApi'
import { roomApi } from '../api/roomApi'
import { storageLocationApi } from '../api/storageLocationApi'
import { ApiRequestError } from '../api/http'
import DuplicateItemModal from '../components/DuplicateItemModal'
import ItemPhoto from '../components/ItemPhoto'
import { ErrorMessage, Loading } from '../components/PageState'
import type { Category, Item, ItemCondition, ItemPayload, Room, StorageLocation } from '../types'

const initial: ItemPayload = { name: '', description: '', quantity: 1, categoryId: 0, roomId: 0,
  storageLocationId: 0, estimatedValue: undefined, purchaseDate: undefined,
  warrantyExpirationDate: undefined, condition: 'GOOD', notes: '' }

const PHOTO_MAX_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export default function ItemFormPage() {
  const { id } = useParams(); const editing = Boolean(id); const navigate = useNavigate()
  const [form, setForm] = useState<ItemPayload>(initial)
  const [rooms, setRooms] = useState<Room[]>([]); const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<StorageLocation[]>([]); const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [existingPhotoVersion, setExistingPhotoVersion] = useState<string>()
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [duplicateItems, setDuplicateItems] = useState<Item[]>([])
  const [pendingDuplicatePayload, setPendingDuplicatePayload] = useState<ItemPayload | null>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  const persistedItemId = useRef<number | null>(id ? Number(id) : null)

  useEffect(() => {
    if (editing) persistedItemId.current = Number(id)
    Promise.all([roomApi.list(), categoryApi.list(), storageLocationApi.list(), editing ? itemApi.get(Number(id)) : Promise.resolve(null)])
      .then(([r,c,l,item]) => {
        setRooms(r); setCategories(c); setLocations(l)
        if (item) {
          setForm({ name:item.name, description:item.description, quantity:item.quantity, categoryId:item.categoryId, roomId:item.roomId, storageLocationId:item.storageLocationId, estimatedValue:item.estimatedValue ?? undefined, purchaseDate:item.purchaseDate, warrantyExpirationDate:item.warrantyExpirationDate, condition:item.condition, notes:item.notes })
          setExistingPhotoUrl(item.photoUrl ?? null); setExistingPhotoVersion(item.updatedAt); setRemovePhoto(false)
        }
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [editing, id])

  useEffect(() => {
    return () => { if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl) }
  }, [photoPreviewUrl])

  function set<K extends keyof ItemPayload>(key: K, value: ItemPayload[K]) { setForm(old => ({ ...old, [key]: value })) }

  function resetFileInput() {
    if (photoInput.current) photoInput.current.value = ''
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!PHOTO_TYPES.has(file.type)) {
      setPhotoFile(null); setPhotoPreviewUrl(null)
      setPhotoError('Choose a JPG, PNG, WebP, or GIF image. This file was not selected.')
      event.target.value = ''
      return
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setPhotoFile(null); setPhotoPreviewUrl(null)
      setPhotoError('Choose an image no larger than 5 MB. This file was not selected.')
      event.target.value = ''
      return
    }

    setPhotoError(''); setPhotoFile(file); setPhotoPreviewUrl(URL.createObjectURL(file)); setRemovePhoto(false)
  }

  function removeSelectedPhoto() {
    setPhotoError(''); setPhotoFile(null); setPhotoPreviewUrl(null)
    setRemovePhoto(Boolean(existingPhotoUrl)); resetFileInput()
  }

  function keepCurrentPhoto() {
    setPhotoError(''); setPhotoFile(null); setPhotoPreviewUrl(null); setRemovePhoto(false); resetFileInput()
  }

  async function persist(payload: ItemPayload, allowDuplicate = false) {
    const creating = persistedItemId.current == null
    let saved
    saved = creating
      ? await itemApi.create(payload, allowDuplicate)
      : await itemApi.update(persistedItemId.current!, payload)
    persistedItemId.current = saved.id

    try {
      if (photoFile) await itemApi.uploadPhoto(saved.id, photoFile)
      else if (removePhoto && existingPhotoUrl) await itemApi.removePhoto(saved.id)
    } catch (e) {
      const action = photoFile ? 'uploaded' : 'removed'
      if (creating) navigate(`/items/${saved.id}/edit`, { replace: true })
      throw new Error(`Item details were saved, but the photo could not be ${action}. ${(e as Error).message} Your item is safe; save again to retry without creating a duplicate.`)
    }

    navigate(`/items/${saved.id}`)
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    const payload = { ...form,
      purchaseDate: form.purchaseDate || undefined, warrantyExpirationDate: form.warrantyExpirationDate || undefined }

    try {
      await persist(payload)
    } catch (cause) {
      if (!editing && cause instanceof ApiRequestError && cause.status === 409
          && cause.response?.duplicateItems?.length) {
        setDuplicateItems(cause.response.duplicateItems)
        setPendingDuplicatePayload(payload)
      } else {
        setError(cause instanceof Error ? cause.message : 'Unable to save this item')
      }
      setSaving(false)
    }
  }

  async function createConfirmedDuplicate() {
    if (!pendingDuplicatePayload) return
    setSaving(true); setError('')
    try {
      await persist(pendingDuplicatePayload, true)
    } catch (cause) {
      setSaving(false)
      throw cause
    }
  }

  if (loading) return <Loading />
  const roomLocations = locations.filter(location => location.roomId === form.roomId)
  const hasSelectedPhoto = Boolean(photoPreviewUrl)
  const hasDisplayedPhoto = hasSelectedPhoto || Boolean(existingPhotoUrl && !removePhoto)

  return <>
    {duplicateItems.length > 0 && <DuplicateItemModal
      items={duplicateItems}
      onClose={() => { setDuplicateItems([]); setPendingDuplicatePayload(null) }}
      onConfirm={createConfirmedDuplicate}
    />}
    <Link to={editing ? `/items/${id}` : '/items'} className="text-sm font-semibold text-pine">← Cancel</Link>
    <div className="mt-5"><p className="eyebrow">{editing ? 'Update record' : 'New record'}</p><h1 className="mt-2 text-4xl">{editing ? 'Edit item' : 'Add an item'}</h1><p className="mt-2 text-stone-500">Record what it is, what it is worth, and exactly where it lives.</p></div>
    {!rooms.length || !locations.length || !categories.length ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">Create at least one <Link className="underline" to="/rooms">room and storage location</Link> and <Link className="underline" to="/categories">category</Link> before adding an item.</div> : null}
    <form onSubmit={submit} className="mt-8 space-y-6">
      {error && <ErrorMessage message={error} />}
      <section className="card grid gap-5 md:grid-cols-2"><div className="md:col-span-2"><label className="label">Item name *</label><input className="field" required maxLength={150} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Passport" /></div>
        <div className="md:col-span-2"><label className="label">Description</label><textarea className="field min-h-24" maxLength={1000} value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Helpful identifying details" /></div>
        <div><label className="label">Quantity *</label><input className="field" type="number" required min="1" value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} /></div>
        <div><label className="label">Condition *</label><select className="field" value={form.condition} onChange={e => set('condition', e.target.value as ItemCondition)}>{['NEW','GOOD','FAIR','DAMAGED'].map(x => <option key={x}>{x}</option>)}</select></div>
      </section>
      <section className="card">
        <div><h2 className="text-xl">Item photo</h2><p id="photo-help" className="mt-1 text-sm text-stone-500">Optional · JPG, PNG, WebP, or GIF · 5 MB maximum</p></div>
        <div className="mt-5 grid items-start gap-5 sm:grid-cols-[16rem_1fr]">
          <ItemPhoto photoUrl={removePhoto ? null : existingPhotoUrl} previewUrl={photoPreviewUrl} cacheKey={existingPhotoVersion} alt={`Photo of ${form.name || 'item'}`} fallbackLabel="No item photo selected" className="aspect-[4/3] w-full rounded-2xl border" loading="eager" />
          <div>
            <input ref={photoInput} id="item-photo" className="sr-only" type="file" tabIndex={-1} aria-label="Item photo" accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif" capture="environment" disabled={saving} onChange={choosePhoto} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => photoInput.current?.click()} disabled={saving} aria-controls="item-photo" aria-describedby={`photo-help${photoError ? ' photo-error' : ''}`} aria-invalid={Boolean(photoError)}>{hasDisplayedPhoto ? 'Replace photo' : 'Choose photo'}</button>
              {photoFile && existingPhotoUrl && <button type="button" className="btn-secondary" onClick={keepCurrentPhoto} disabled={saving}>Use current photo</button>}
              {hasDisplayedPhoto && <button type="button" className="btn-danger" onClick={removeSelectedPhoto} disabled={saving}>Remove photo</button>}
              {removePhoto && existingPhotoUrl && <button type="button" className="btn-secondary" onClick={keepCurrentPhoto} disabled={saving}>Keep current photo</button>}
            </div>
            {photoFile && <p className="mt-3 break-all text-sm text-stone-600">{photoFile.name} · {(photoFile.size / 1024 / 1024).toFixed(1)} MB</p>}
            {removePhoto && existingPhotoUrl && <p className="mt-3 text-sm text-stone-600">The current photo will be removed when you save.</p>}
            {photoError && <p id="photo-error" className="mt-3 text-sm font-semibold text-red-700" role="alert">{photoError}</p>}
          </div>
        </div>
      </section>
      <section className="card"><h2 className="mb-5 text-xl">Where is it?</h2><div className="grid gap-5 md:grid-cols-3">
        <div><label className="label">Room *</label><select className="field" required value={form.roomId || ''} onChange={e => { set('roomId', Number(e.target.value)); set('storageLocationId', 0) }}><option value="">Select room</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
        <div><label className="label">Storage location *</label><select className="field" required value={form.storageLocationId || ''} onChange={e => set('storageLocationId', Number(e.target.value))} disabled={!form.roomId}><option value="">{form.roomId && !roomLocations.length ? 'Add a location to this room first' : 'Select location'}</option>{roomLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>{form.roomId > 0 && !roomLocations.length && <p className="mt-2 text-sm text-amber-700">This room has no storage locations. <Link className="font-semibold underline" to="/rooms">Add one first</Link>.</p>}</div>
        <div><label className="label">Category *</label><select className="field" required value={form.categoryId || ''} onChange={e => set('categoryId', Number(e.target.value))}><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </div></section>
      <section className="card"><h2 className="mb-5 text-xl">Value & dates</h2><div className="grid gap-5 md:grid-cols-3">
        <div><label className="label">Estimated value each</label><input className="field" type="number" min="0" step="0.01" value={form.estimatedValue ?? ''} onChange={e => set('estimatedValue', e.target.value === '' ? undefined : Number(e.target.value))} /></div>
        <div><label className="label">Purchase date</label><input className="field" type="date" value={form.purchaseDate ?? ''} onChange={e => set('purchaseDate', e.target.value || undefined)} /></div>
        <div><label className="label">Warranty expiration</label><input className="field" type="date" value={form.warrantyExpirationDate ?? ''} onChange={e => set('warrantyExpirationDate', e.target.value || undefined)} /></div>
        <div className="md:col-span-3"><label className="label">Notes</label><textarea className="field min-h-24" maxLength={2000} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Serial number, warranty details, or anything else useful" /></div>
      </div></section>
      <div className="flex justify-end gap-3"><Link to={editing ? `/items/${id}` : '/items'} className="btn-secondary">Cancel</Link><button className="btn-primary" disabled={saving || !rooms.length || !categories.length || !form.storageLocationId}>{saving ? (photoFile ? 'Uploading photo…' : 'Saving…') : editing ? 'Save changes' : 'Add item'}</button></div>
    </form>
  </>
}
