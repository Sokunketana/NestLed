import { FormEvent, useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon'
import type { Room, StorageLocation } from '../types'

export type SpaceEditTarget =
  | { type: 'room'; value: Room }
  | { type: 'location'; value: StorageLocation }

export type SpaceEditForm = {
  name: string
  description: string
  roomId?: number
}

type SpaceEditModalProps = {
  target: SpaceEditTarget
  rooms: Room[]
  onClose: () => void
  onSave: (form: SpaceEditForm) => Promise<void> | void
}

export default function SpaceEditModal({ target, rooms, onClose, onSave }: SpaceEditModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const errorId = useId()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<SpaceEditForm>(() => ({
    name: target.value.name,
    description: target.value.description ?? '',
    ...(target.type === 'location' ? { roomId: target.value.roomId } : {}),
  }))

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null

    dialog?.showModal()
    nameInputRef.current?.focus()

    return () => {
      if (dialog?.open) dialog.close()
      previouslyFocused?.focus()
    }
  }, [])

  function close() {
    if (!isSaving) onClose()
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await onSave(form)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save these changes. Please try again.')
      setIsSaving(false)
    }
  }

  const isLocation = target.type === 'location'
  const title = isLocation ? 'Edit storage location' : 'Edit room'

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
      onCancel={event => { event.preventDefault(); close() }}
      onClick={event => { if (event.target === event.currentTarget) close() }}
    >
      <form className="p-6 sm:p-7" onSubmit={save}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${isLocation ? 'bg-sage text-pine' : 'bg-coral/10 text-coral'}`} aria-hidden="true">
              <Icon name={isLocation ? 'map' : 'home'} className="h-6 w-6" />
            </div>
            <div>
              <h2 id={titleId} className="text-2xl">{title}</h2>
              <p id={descriptionId} className="mt-1 leading-relaxed text-stone-600">
                Update the details for “{target.value.name}”.
              </p>
            </div>
          </div>
          <button type="button" className="btn-secondary h-9 w-9 shrink-0 p-0" onClick={close} disabled={isSaving} aria-label="Close">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">
          <label className="label" htmlFor={`${titleId}-name`}>Name *</label>
          <input
            ref={nameInputRef}
            id={`${titleId}-name`}
            className="field"
            required
            maxLength={100}
            value={form.name}
            onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
            disabled={isSaving}
          />
        </div>

        {isLocation && (
          <div className="mt-4">
            <label className="label" htmlFor={`${titleId}-room`}>Room *</label>
            <select
              id={`${titleId}-room`}
              className="field"
              required
              value={form.roomId || ''}
              onChange={event => setForm(current => ({ ...current, roomId: Number(event.target.value) }))}
              disabled={isSaving}
            >
              <option value="">Select room</option>
              {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
            </select>
          </div>
        )}

        <div className="mt-4">
          <label className="label" htmlFor={`${titleId}-description`}>Description</label>
          <textarea
            id={`${titleId}-description`}
            className="field min-h-24"
            maxLength={500}
            value={form.description}
            onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
            disabled={isSaving}
          />
        </div>

        {error && <p id={errorId} role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={close} disabled={isSaving}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSaving}>
            <Icon name={isSaving ? 'history' : 'check'} className="h-4 w-4" />
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
