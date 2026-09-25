import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'
import Icon from '../../components/Icon'
import ConfirmationModal from '../../components/ConfirmationModal'

export default function ProfilePage() {
  const { user, deleteAccount, updateDisplayName } = useAuth()
  const [showDeleteAccountConfirmation, setShowDeleteAccountConfirmation] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  function startEditingName() {
    setNameDraft(user?.displayName || '')
    setNameError(null)
    setIsEditingName(true)
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedName = nameDraft.trim()
    if (!normalizedName) {
      setNameError('Name is required.')
      return
    }

    setNameError(null)
    setIsSavingName(true)
    try {
      await updateDisplayName(normalizedName)
      setIsEditingName(false)
    } catch (cause) {
      setNameError(cause instanceof Error ? cause.message : 'Unable to save your name. Please try again.')
    } finally {
      setIsSavingName(false)
    }
  }

  return <>
    <section aria-labelledby="account-details-title" className="card mb-7">
      <div>
        <h2 id="account-details-title" className="text-xl">Account details</h2>
        <p className="mt-1 text-sm text-ink-soft">Your account details.</p>
      </div>
      <dl className="mt-4 divide-y divide-line">
        <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <dt className="text-sm text-ink-soft">Name</dt>
          <dd className="min-w-0 sm:text-right">
            {isEditingName ? <form className="space-y-2 sm:ml-auto sm:max-w-sm" onSubmit={saveName}>
              <input
                autoFocus
                aria-label="Name"
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? 'account-name-error' : undefined}
                className="field h-10"
                maxLength={200}
                name="displayName"
                type="text"
                value={nameDraft}
                onChange={event => setNameDraft(event.target.value)}
                disabled={isSavingName}
              />
              <div className="flex gap-2 sm:justify-end">
                <button type="submit" className="btn-primary px-3 py-2" disabled={isSavingName}>
                  {isSavingName ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="btn-secondary px-3 py-2" disabled={isSavingName} onClick={() => setIsEditingName(false)}>
                  Cancel
                </button>
              </div>
              {nameError && <p id="account-name-error" role="alert" className="text-left text-sm text-red-700">{nameError}</p>}
            </form> : <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="break-words text-sm font-semibold">{user?.displayName || 'Not provided'}</span>
              <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-soft transition hover:bg-cream hover:text-ink" aria-label="Edit name" onClick={startEditingName}>
                <Icon name="edit" className="h-4 w-4" />
              </button>
            </div>}
          </dd>
        </div>
        <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <dt className="text-sm text-ink-soft">Email</dt>
          <dd className="min-w-0 break-all text-sm font-semibold">{user?.email || 'Not provided'}</dd>
        </div>
      </dl>
    </section>

    <section aria-labelledby="delete-account-title" className="card border-2 border-red-300 bg-red-50/60 p-6 shadow-[0_2px_10px_rgba(185,28,28,0.08)] sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-100 text-red-700 ring-4 ring-red-100/60"><Icon name="trash" className="h-5 w-5" /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">Danger zone</p>
          <h2 id="delete-account-title" className="mt-1 text-2xl text-red-950">Delete account</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-red-950/70">Permanently remove your account. If you are the only household member, this also deletes its rooms, locations, categories, items, and movement history.</p>
        </div>
      </div>
      <button type="button" className="btn mt-6 bg-red-700 text-white shadow-sm hover:bg-red-800 focus-visible:outline-red-700" onClick={() => setShowDeleteAccountConfirmation(true)}>
        <Icon name="trash" className="h-4 w-4" />Delete account
      </button>
    </section>

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
