import { useId, useState, type FormEvent } from 'react'
import { categoryApi } from '../../api/categoryApi'
import Icon from '../Icon'
import SpaceColorPicker from '../SpaceColorPicker'
import type { AddCategoryModalProps } from './AddCategoryModal.type'

const defaultColor = '#145247'

export default function AddCategoryModal({ onClose, onSaved }: AddCategoryModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const errorId = useId()
  const [name, setName] = useState('')
  const [color, setColor] = useState(defaultColor)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const category = await categoryApi.create({ name: name.trim(), color })
      await onSaved(category)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to add this category.')
      setSaving(false)
    }
  }

  function close() {
    if (!saving) onClose()
  }

  return <div
    className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm"
    role="presentation"
    onMouseDown={event => { if (event.target === event.currentTarget) close() }}
  >
    <section
      className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-line bg-surface shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage text-pine"><Icon name="tag" className="h-5 w-5" /></span>
          <div>
            <h2 id={titleId} className="text-2xl">Add a category</h2>
            <p id={descriptionId} className="mt-1 text-sm text-ink-soft">Create a label here and use it for this item right away.</p>
          </div>
        </div>
        <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-stone-400 hover:bg-cream hover:text-ink" aria-label="Close add category dialog" onClick={close} disabled={saving}>
          <Icon name="x" className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
        <label className="block">
          <span className="label">Name *</span>
          <input autoFocus required maxLength={100} className="field" value={name} onChange={event => setName(event.target.value)} placeholder="Electronics" disabled={saving} />
        </label>
        <SpaceColorPicker value={color} onChange={setColor} disabled={saving} />
        {error && <p id={errorId} role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={close} disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            <Icon name={saving ? 'history' : 'plus'} className="h-4 w-4" />
            {saving ? 'Saving…' : 'Add category'}
          </button>
        </div>
      </form>
    </section>
  </div>
}
