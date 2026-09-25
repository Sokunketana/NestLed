import { useState, type FormEvent } from 'react'
import { revalidateInventory } from '../../api/cache'
import { roomApi } from '../../api/roomApi'
import { storageLocationApi } from '../../api/storageLocationApi'
import { defaultLocationColor, defaultRoomColor } from '../../spaceColors'
import Icon from '../Icon'
import SpaceColorPicker from '../SpaceColorPicker'
import type { AddSpaceModalProps } from './AddSpaceModal.type'

export default function AddSpaceModal({ mode, room, onClose, onSaved }: AddSpaceModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(mode === 'room' ? defaultRoomColor : defaultLocationColor)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const label = mode === 'room' ? 'room' : 'location'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mode === 'location' && !room) return

    setSaving(true)
    setError('')
    try {
      const space = mode === 'room'
        ? await roomApi.create({ name: name.trim(), description: description.trim(), color })
        : await storageLocationApi.create({ name: name.trim(), description: description.trim(), color, roomId: room!.id })
      await revalidateInventory({ dashboard: true, rooms: true, locations: true })
      onSaved(space)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to add this ${label}.`)
      setSaving(false)
    }
  }

  return <div className="fixed inset-0 z-40 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <section className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-line bg-surface shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="add-space-title">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
        <div><h2 id="add-space-title" className="text-2xl">Add {label}</h2>{room && <p className="mt-1 text-sm text-ink-soft">In {room.name}</p>}</div>
        <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-stone-400 hover:bg-cream hover:text-ink" aria-label={`Close add ${label} dialog`} onClick={onClose} disabled={saving}><Icon name="x" className="h-5 w-5" /></button>
      </div>
      <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
        <label className="block"><span className="label">{mode === 'room' ? 'Room' : 'Location'} name *</span><input autoFocus required maxLength={100} className="field" value={name} onChange={event => setName(event.target.value)} placeholder={mode === 'room' ? 'Bedroom' : 'Top drawer'} /></label>
        <label className="block"><span className="label">Description <span className="font-normal text-stone-400">(optional)</span></span><input maxLength={500} className="field" value={description} onChange={event => setDescription(event.target.value)} placeholder="Anything helpful to remember" /></label>
        <SpaceColorPicker value={color} onChange={setColor} disabled={saving} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}><Icon name="plus" className="h-4 w-4" />{saving ? 'Saving…' : `Add ${label}`}</button></div>
      </form>
    </section>
  </div>
}
