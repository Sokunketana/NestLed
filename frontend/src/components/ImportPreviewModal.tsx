import { useEffect, useId, useRef } from 'react'
import type { HouseholdImportIssue, HouseholdImportPreview } from '../api/householdApi'
import Icon from './Icon'

type ImportPreviewModalProps = {
  preview: HouseholdImportPreview
  confirming: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

function issueLabel(issue: HouseholdImportIssue) {
  return issue.path ? `${issue.path}: ${issue.message}` : issue.message
}

export default function ImportPreviewModal({ preview, confirming, error, onClose, onConfirm }: ImportPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const errorId = useId()
  const sourceName = preview.sourceHouseholdName || 'the selected household'

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

  const summaries = [
    ['Rooms to create', preview.roomsToCreate],
    ['Existing rooms', preview.existingRooms],
    ['Locations to create', preview.locationsToCreate],
    ['Existing locations', preview.existingLocations],
    ['Categories to create', preview.categoriesToCreate],
    ['Existing categories', preview.existingCategories],
    ['Items to import', preview.itemsToImport],
    ['Duplicate items', preview.duplicateItems],
    ['Movements skipped', preview.movementRecordsSkipped],
  ] as const

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
        <Icon name="upload" className="h-5 w-5" />
      </div>
      <h2 id={titleId} className="mt-5 text-2xl">Review import</h2>
      <p id={descriptionId} className="mt-2 leading-relaxed text-stone-600">
        Review what will be added to {preview.destinationHouseholdName} from {sourceName} before importing.
      </p>

      <div className="mt-5 rounded-2xl bg-cream px-4 py-3 text-sm leading-relaxed text-stone-600">
        <p><span className="font-bold text-ink">Source format:</span> Nestled household export v{preview.sourceVersion}</p>
        <p className="mt-1"><span className="font-bold text-ink">Existing data:</span> Matching rooms, locations, and categories are reused.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {summaries.map(([label, count]) => <div key={label} className="rounded-2xl bg-cream px-3 py-3">
          <p className="text-xs font-semibold text-stone-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-pine">{count}</p>
        </div>)}
      </div>

      <div className="mt-5 space-y-3 text-sm leading-relaxed text-stone-600">
        <p><span className="font-bold text-ink">Items:</span> Items are always added as new records. Existing items are never overwritten.</p>
        <p><span className="font-bold text-ink">Not imported:</span> Movement history and photo files are skipped because the export does not contain the original photo files.</p>
      </div>

      {preview.errors.length > 0 && <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
        <p className="font-bold">Fix these issues before importing:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {preview.errors.map((issue, index) => <li key={`${issue.path}-${index}`}>{issueLabel(issue)}</li>)}
        </ul>
      </div>}

      {preview.warnings.length > 0 && <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-bold">Please note:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {preview.warnings.map((issue, index) => <li key={`${issue.path}-${index}`}>{issueLabel(issue)}</li>)}
        </ul>
      </div>}

      {error && <p id={errorId} role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button ref={cancelButtonRef} type="button" className="btn-secondary" onClick={close} disabled={confirming}>Back</button>
        <button type="button" className="btn-primary" onClick={() => void onConfirm()} disabled={!preview.canImport || confirming}>
          {confirming ? 'Importing…' : `Import ${preview.itemsToImport} item${preview.itemsToImport === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  </dialog>
}
