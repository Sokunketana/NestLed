import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import Icon from '../components/Icon'
import ConfirmationModal from '../components/ConfirmationModal'

export default function ProfilePage() {
  const { user, deleteAccount } = useAuth()
  const [showDeleteAccountConfirmation, setShowDeleteAccountConfirmation] = useState(false)

  return <>
    <div className="space-y-7">
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

      <section className="card border-red-200 bg-red-50/30">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-700"><Icon name="trash" className="h-4 w-4" /></span>
          <div><h2 className="text-xl">Delete account</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600">Permanently remove your account. If you are the only household member, this also deletes its rooms, locations, categories, items, and movement history.</p></div>
        </div>
        <button type="button" className="btn mt-5 border border-red-200 bg-white text-red-700 hover:bg-red-50" onClick={() => setShowDeleteAccountConfirmation(true)}>
          <Icon name="trash" className="h-4 w-4" />Delete account
        </button>
      </section>
    </div>

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
