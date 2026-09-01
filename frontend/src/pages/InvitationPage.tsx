import { useState } from 'react'
import { invitationApi } from '../api/invitationApi'
import { ApiRequestError } from '../api/http'
import { useAuth } from '../auth/AuthContext'

export default function InvitationPage() {
  const { user, logout } = useAuth()
  const invitation = user?.pendingInvitation
  const [action, setAction] = useState<'accept' | 'reject' | 'signout' | null>(null)
  const [declined, setDeclined] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleStaleInvitation(cause: unknown) {
    if (cause instanceof ApiRequestError && cause.status === 404) {
      window.location.reload()
      return true
    }
    return false
  }

  async function accept() {
    if (!invitation) return
    setAction('accept')
    setError(null)
    try {
      await invitationApi.accept(invitation.id)
      window.location.assign('/')
    } catch (cause) {
      if (handleStaleInvitation(cause)) return
      setError(cause instanceof Error ? cause.message : 'Could not accept this invitation')
      setAction(null)
    }
  }

  async function reject() {
    if (!invitation) return
    setAction('reject')
    setError(null)
    try {
      await invitationApi.reject(invitation.id)
      setDeclined(true)
      try {
        await logout()
      } catch {
        setError('The invitation was declined, but we could not sign you out. Please try again.')
        setAction(null)
      }
    } catch (cause) {
      if (handleStaleInvitation(cause)) return
      setError(cause instanceof Error ? cause.message : 'Could not decline this invitation')
      setAction(null)
    }
  }

  async function signOut() {
    setAction('signout')
    setError(null)
    try {
      await logout()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign out')
      setAction(null)
    }
  }

  if (!invitation || declined) {
    return <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="card w-full max-w-md p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pine text-2xl text-white">⌂</span>
        <p className="eyebrow mt-6">Household access</p>
        <h1 className="mt-2 text-3xl text-pine">{declined ? 'Invitation declined' : 'No invitation found'}</h1>
        <p className="mt-3 text-stone-600">
          {declined
            ? 'You have not joined the household. Its owner can invite you again later.'
            : 'Ask a household owner to invite your Google email address before signing in.'}
        </p>
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button type="button" className="btn-secondary mt-7 w-full" disabled={action !== null}
          onClick={() => void signOut()}>{action === 'signout' ? 'Signing out…' : 'Sign out'}</button>
      </section>
    </main>
  }

  return <main className="grid min-h-screen place-items-center px-5 py-10">
    <section className="card w-full max-w-lg p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pine text-2xl text-white">⌂</span>
      <p className="eyebrow mt-6">Household invitation</p>
      <h1 className="mt-2 text-4xl text-pine">Join {invitation.householdName}?</h1>
      <p className="mt-3 text-stone-600">
        Accept to share this household’s rooms, storage locations, categories, and inventory.
        You will not become a member unless you accept.
      </p>
      <p className="mt-4 text-sm text-stone-500">Signed in as {user.email}</p>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
        <button type="button" className="btn-secondary flex-1" disabled={action !== null} onClick={() => void reject()}>
          {action === 'reject' ? 'Declining…' : 'Decline'}
        </button>
        <button type="button" className="btn-primary flex-1" disabled={action !== null} onClick={() => void accept()}>
          {action === 'accept' ? 'Joining…' : 'Accept invitation'}
        </button>
      </div>
    </section>
  </main>
}
