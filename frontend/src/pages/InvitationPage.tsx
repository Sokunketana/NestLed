import { useState } from 'react'
import { ApiRequestError } from '../api/http'
import { invitationApi } from '../api/invitationApi'
import { useAuth } from '../auth/AuthContext'

export default function InvitationPage() {
  const { user } = useAuth()
  const invitations = user?.pendingInvitations ?? []
  const invitation = invitations[0]
  const [action, setAction] = useState<'accept' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleStaleInvitation(cause: unknown) {
    if (cause instanceof ApiRequestError && cause.status === 404) {
      window.location.reload()
      return true
    }
    return false
  }

  async function respond(decision: 'accept' | 'reject') {
    if (!invitation) return
    setAction(decision)
    setError(null)
    try {
      if (decision === 'accept') {
        await invitationApi.accept(invitation.id)
      } else {
        await invitationApi.reject(invitation.id)
      }
      window.location.assign('/')
    } catch (cause) {
      if (handleStaleInvitation(cause)) return
      setError(cause instanceof Error ? cause.message : `Could not ${decision} this invitation`)
      setAction(null)
    }
  }

  if (!invitation) {
    return <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="card w-full max-w-md p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pine text-2xl text-white">⌂</span>
        <p className="eyebrow mt-6">Household invitations</p>
        <h1 className="mt-2 text-3xl text-pine">You’re all caught up</h1>
        <p className="mt-3 text-stone-600">There are no household invitations waiting for your response.</p>
        <button type="button" className="btn-primary mt-7 w-full" onClick={() => window.location.assign('/')}>Continue</button>
      </section>
    </main>
  }

  return <main className="grid min-h-screen place-items-center px-5 py-10">
    <section className="card w-full max-w-lg p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pine text-2xl text-white">⌂</span>
      <p className="eyebrow mt-6">Household invitation</p>
      <h1 className="mt-2 text-4xl text-pine">Join {invitation.householdName}?</h1>
      <p className="mt-3 text-stone-600">
        Accept to access this household’s rooms, locations, categories, and inventory.
        Your own household stays separate, and you can switch between them at any time.
      </p>
      <p className="mt-4 text-sm text-stone-500">Signed in as {user?.email}</p>
      {invitations.length > 1 && <p className="mt-2 text-xs font-semibold text-stone-500">
        {invitations.length} invitations are waiting. You’ll review them one at a time.
      </p>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
        <button type="button" className="btn-secondary flex-1" disabled={action !== null}
          onClick={() => void respond('reject')}>
          {action === 'reject' ? 'Declining…' : 'Decline'}
        </button>
        <button type="button" className="btn-primary flex-1" disabled={action !== null}
          onClick={() => void respond('accept')}>
          {action === 'accept' ? 'Joining…' : 'Accept invitation'}
        </button>
      </div>
    </section>
  </main>
}
