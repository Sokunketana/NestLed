import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  householdApi,
  type HouseholdExportPreview,
  type HouseholdImportPreview,
  type HouseholdImportResult,
} from '../api/householdApi'
import Icon from '../components/Icon'
import ConfirmationModal from '../components/ConfirmationModal'
import ExportPreviewModal from '../components/ExportPreviewModal'
import ImportPreviewModal from '../components/ImportPreviewModal'
import HouseholdSettings from '../components/HouseholdSettings'

type ExportFormat = 'json' | 'csv'

function filenamePart(value: string | null | undefined) {
  const safe = (value || 'household').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
  return (safe || 'household').toLowerCase()
}

export default function ProfilePage() {
  const { user, deleteAccount } = useAuth()
  const [previewBusy, setPreviewBusy] = useState<ExportFormat | null>(null)
  const [exportBusy, setExportBusy] = useState(false)
  const [preview, setPreview] = useState<HouseholdExportPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importPreviewBusy, setImportPreviewBusy] = useState(false)
  const [importBusy, setImportBusy] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<HouseholdImportPreview | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [showDeleteAccountConfirmation, setShowDeleteAccountConfirmation] = useState(false)

  async function reviewExport(format: ExportFormat) {
    setPreviewBusy(format)
    setError(null)
    try {
      setPreview(await householdApi.exportPreview(format))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not prepare the export preview')
    } finally {
      setPreviewBusy(null)
    }
  }

  async function exportData() {
    if (!preview) return
    setExportBusy(true)
    setError(null)
    try {
      const blob = await householdApi.exportData(preview.format)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${filenamePart(user?.householdName)}-inventory.${preview.format}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      setPreview(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not export household data')
    } finally {
      setExportBusy(false)
    }
  }

  async function reviewImport(file: File) {
    setImportPreviewBusy(true)
    setImportError(null)
    setImportSuccess(null)
    setImportFile(file)
    try {
      setImportPreview(await householdApi.importPreview(file))
    } catch (cause) {
      setImportFile(null)
      setImportError(cause instanceof Error ? cause.message : 'Could not prepare the import preview')
    } finally {
      setImportPreviewBusy(false)
    }
  }

  async function importData() {
    if (!importPreview || !importFile) return
    setImportBusy(true)
    setImportError(null)
    try {
      const result: HouseholdImportResult = await householdApi.importData(importFile)
      setImportPreview(null)
      setImportFile(null)
      setImportSuccess(`Imported ${result.itemsImported} item${result.itemsImported === 1 ? '' : 's'} into ${result.destinationHouseholdName}.`)
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : 'Could not import household data')
    } finally {
      setImportBusy(false)
    }
  }

  const isOwner = user?.householdRole === 'OWNER'
  const busy = previewBusy !== null || exportBusy || importPreviewBusy || importBusy

  return <>
  <div className="space-y-7">
    <div>
      <p className="eyebrow">Account</p>
      <h1 className="page-title mt-2">Profile & settings</h1>
      <p className="mt-2 text-stone-500">Manage your account and shared household data.</p>
    </div>

    <section className="card">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-sage text-pine"><Icon name="users" className="h-4 w-4" /></span>
        <div><h2 className="text-xl">Profile</h2><p className="mt-1 text-sm text-ink-soft">Your signed-in Google account.</p></div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        {user?.pictureUrl
          ? <img src={user.pictureUrl} alt="" referrerPolicy="no-referrer" className="h-12 w-12 rounded-full object-cover" />
          : <span className="grid h-12 w-12 place-items-center rounded-full bg-sage text-lg font-bold text-pine">{(user?.displayName || user?.email || 'N')[0].toUpperCase()}</span>}
        <div className="min-w-0">
          <p className="truncate font-semibold">{user?.displayName || 'Your account'}</p>
          <p className="truncate text-sm text-stone-500">{user?.email}</p>
        </div>
      </div>
    </section>

    <HouseholdSettings embedded />

    <section className="card">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-cream text-pine"><Icon name="box" className="h-4 w-4" /></span>
        <div><h2 className="text-xl">Household data</h2><p className="mt-1 text-sm text-ink-soft">Export or import the shared inventory so it can be backed up or moved to another household.</p></div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {importError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{importError}</p>}
      {importSuccess && <p role="status" className="mt-4 rounded-xl bg-sage px-4 py-3 text-sm text-pine">{importSuccess}</p>}
      {isOwner ? <>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void reviewExport('json')}>
            <Icon name="download" className="h-4 w-4" />{previewBusy === 'json' ? 'Loading preview…' : 'Export JSON'}
          </button>
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void reviewExport('csv')}>
            <Icon name="download" className="h-4 w-4" />{previewBusy === 'csv' ? 'Loading preview…' : 'Export CSV'}
          </button>
          <label className={`btn-secondary cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
            <Icon name="upload" className="h-4 w-4" />{importPreviewBusy ? 'Loading preview…' : 'Import JSON'}
            <input
              type="file"
              accept=".json,application/json"
              aria-label="Import JSON file"
              className="sr-only"
              disabled={busy}
              onChange={event => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void reviewImport(file)
              }}
            />
          </label>
        </div>
        <p className="mt-4 text-xs text-stone-500">JSON includes rooms, locations, categories, items, and movement history. CSV contains one row per item. Photos and member accounts are not included. Imports accept Nestled JSON exports and add items without overwriting existing records.</p>
      </> : <p className="mt-5 rounded-xl bg-cream px-4 py-3 text-sm text-stone-600">Only the household owner can export or import shared household data.</p>}
    </section>

    <section className="card border-red-200 bg-red-50/30">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-700"><Icon name="trash" className="h-4 w-4" /></span>
        <div><h2 className="text-xl">Delete account</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600">Permanently remove your account. If you are the only household member, this also deletes its rooms, locations, categories, items, and movement history.</p></div>
      </div>
      <button type="button" className="btn mt-5 border border-red-200 bg-white text-red-700 hover:bg-red-50" disabled={busy} onClick={() => setShowDeleteAccountConfirmation(true)}>
        <Icon name="trash" className="h-4 w-4" />Delete account
      </button>
    </section>
  </div>
  {preview && <ExportPreviewModal
    preview={preview}
    confirming={exportBusy}
    error={error}
    onClose={() => { if (!exportBusy) { setPreview(null); setError(null) } }}
    onConfirm={exportData}
  />}
  {importPreview && <ImportPreviewModal
    preview={importPreview}
    confirming={importBusy}
    error={importError}
    onClose={() => { if (!importBusy) { setImportPreview(null); setImportFile(null); setImportError(null) } }}
    onConfirm={importData}
  />}
  {showDeleteAccountConfirmation && <ConfirmationModal
    title="Delete your account?"
    description="This cannot be undone. Your account will be removed permanently. A solo household and its inventory will also be deleted; shared household data stays with the other members."
    confirmLabel="Delete account"
    confirmingLabel="Deleting account…"
    errorMessage="Unable to delete your account. Please try again."
    onClose={() => setShowDeleteAccountConfirmation(false)}
    onConfirm={deleteAccount}
  />}
  </>
}
