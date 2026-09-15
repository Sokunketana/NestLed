import { useEffect, useId, useRef } from 'react'
import type { HouseholdExportPreview } from '../api/householdApi'

type ExportPreviewModalProps = {
  preview: HouseholdExportPreview
  confirming: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function ExportPreviewModal({ preview, confirming, error, onClose, onConfirm }: ExportPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const errorId = useId()
  const formatLabel = preview.format.toUpperCase()
  const included = preview.format === 'json'
    ? 'Rooms, storage locations, categories, items, and movement history.'
    : 'One row per item, including its room, storage location, category, and item fields.'
  const excluded = preview.format === 'json'
    ? 'Photo files, member accounts, invitations, and database IDs.'
    : 'Standalone empty rooms, locations, or categories; movement history; photo files; member accounts; and database IDs.'

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

  return <dialog
    ref={dialogRef}
    aria-labelledby={titleId}
    aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
    className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-3xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)]"
    onCancel={event => { event.preventDefault(); close() }}
    onClick={event => { if (event.target === event.currentTarget) close() }}
  >
    <div className="p-5 sm:p-7">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-sage text-pine" aria-hidden="true">
        <span className="text-lg font-bold">{formatLabel[0]}</span>
      </div>
      <h2 id={titleId} className="mt-5 text-2xl">Review {formatLabel} export</h2>
      <p id={descriptionId} className="mt-2 leading-relaxed text-stone-600">This is what will be included in the download for {preview.householdName}.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ['Rooms', preview.roomCount],
          ['Locations', preview.storageLocationCount],
          ['Categories', preview.categoryCount],
          ['Items', preview.itemCount],
          [preview.movementHistoryIncluded ? 'Movements' : 'Movements (excluded)', preview.movementCount],
          ['Items with photos', preview.photoCount],
        ].map(([label, count]) => <div key={label} className="rounded-2xl bg-cream px-3 py-3">
          <p className="text-xs font-semibold text-stone-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-pine">{count}</p>
        </div>)}
      </div>

      <div className="mt-5 space-y-3 text-sm leading-relaxed text-stone-600">
        <p><span className="font-bold text-ink">Included:</span> {included}</p>
        <p><span className="font-bold text-ink">Not included:</span> {excluded}</p>
        {preview.format === 'csv' && <p><span className="font-bold text-ink">Note:</span> CSV contains {preview.itemCount} item row{preview.itemCount === 1 ? '' : 's'}; the other counts describe the related values available on those rows.</p>}
        {preview.format === 'json' && preview.movementHistoryIncluded && <p><span className="font-bold text-ink">Movement history:</span> {preview.movementCount} record{preview.movementCount === 1 ? '' : 's'} will be included.</p>}
      </div>

      {error && <p id={errorId} role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button ref={cancelButtonRef} type="button" className="btn-secondary" onClick={close} disabled={confirming}>Back</button>
        <button type="button" className="btn-primary" onClick={() => void onConfirm()} disabled={confirming}>
          {confirming ? 'Preparing download…' : `Download ${formatLabel}`}
        </button>
      </div>
    </div>
  </dialog>
}
