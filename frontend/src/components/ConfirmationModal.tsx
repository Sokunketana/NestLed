import { useEffect, useId, useRef, useState } from 'react'

type ConfirmationModalProps = {
  title: string
  description: string
  confirmLabel?: string
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

export default function ConfirmationModal({
  title,
  description,
  confirmLabel = 'Delete',
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const errorId = useId()
  const [isConfirming, setIsConfirming] = useState(false)
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

  async function confirm() {
    setError('')
    setIsConfirming(true)
    try {
      await onConfirm()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete this entry. Please try again.')
      setIsConfirming(false)
    }
  }

  function close() {
    if (!isConfirming) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
      onCancel={event => { event.preventDefault(); close() }}
      onClick={event => { if (event.target === event.currentTarget) close() }}
    >
      <div className="p-6 sm:p-7">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-700" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9 14.4 18m-4.8 0L9.26 9m9.97-3.21c.34.05.68.1 1.02.16M19.23 5.79 18.07 20.9a2.25 2.25 0 0 1-2.24 2.1H8.17a2.25 2.25 0 0 1-2.24-2.1L4.77 5.79m14.46 0a48.1 48.1 0 0 0-3.48-.4m-10.98.4c-.34.05-.68.1-1.02.16m1.02-.16a48.1 48.1 0 0 1 3.48-.4m7.5 0v-.92c0-1.18-.91-2.17-2.09-2.2a52.5 52.5 0 0 0-3.32 0c-1.18.03-2.09 1.02-2.09 2.2v.92m7.5 0a48.67 48.67 0 0 0-7.5 0" />
          </svg>
        </div>
        <h2 id={titleId} className="mt-5 text-2xl">{title}</h2>
        <p id={descriptionId} className="mt-2 leading-relaxed text-stone-600">{description}</p>
        {error && <p id={errorId} role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelButtonRef} type="button" className="btn-secondary" onClick={close} disabled={isConfirming}>Cancel</button>
          <button type="button" className="btn bg-red-700 text-white hover:bg-red-800" onClick={confirm} disabled={isConfirming}>
            {isConfirming ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
