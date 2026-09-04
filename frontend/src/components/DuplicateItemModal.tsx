import { useEffect, useId, useRef, useState } from 'react'
import type { Item } from '../types'

type DuplicateItemModalProps = {
  items: Item[]
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function DuplicateItemModal({ items, onClose, onConfirm }: DuplicateItemModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const errorId = useId()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog?.showModal()
    cancelButtonRef.current?.focus()
    return () => {
      if (dialog?.open) dialog.close()
      previouslyFocused?.focus()
    }
  }, [])

  function close() {
    if (!confirming) onClose()
  }

  async function confirm() {
    setError('')
    setConfirming(true)
    try {
      await onConfirm()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create this item. Please try again.')
      setConfirming(false)
    }
  }

  return <dialog
    ref={dialogRef}
    aria-labelledby={titleId}
    aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
    className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-3xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)]"
    onCancel={event => { event.preventDefault(); close() }}
    onClick={event => { if (event.target === event.currentTarget) close() }}
  >
    <div className="p-5 sm:p-7">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-800" aria-hidden="true">
        <span className="text-2xl font-bold">!</span>
      </div>
      <h2 id={titleId} className="mt-5 text-2xl">Possible duplicate item</h2>
      <p id={descriptionId} className="mt-2 leading-relaxed text-stone-600">
        {items.length === 1 ? 'This item' : 'These items'} already {items.length === 1 ? 'exists' : 'exist'} with the same name, category, room, and storage location.
      </p>
      <ul className="mt-5 max-h-64 space-y-3 overflow-y-auto">
        {items.map(item => <li key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-ink">{item.name}</p>
          <p className="mt-1 break-words text-sm text-stone-600">{item.roomName} → {item.storageLocationName} · {item.categoryName} · Quantity {item.quantity}</p>
        </li>)}
      </ul>
      {error && <p id={errorId} role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button ref={cancelButtonRef} type="button" className="btn-secondary" onClick={close} disabled={confirming}>Edit item details</button>
        <button type="button" className="btn-primary" onClick={confirm} disabled={confirming}>
          {confirming ? 'Creating…' : 'Create anyway'}
        </button>
      </div>
    </div>
  </dialog>
}
