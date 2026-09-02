import { FormEvent, useEffect, useState } from 'react'
import { householdApi, type Household, type HouseholdMember } from '../api/householdApi'
import { invitationApi } from '../api/invitationApi'
import { ApiRequestError } from '../api/http'
import ConfirmationModal from '../components/ConfirmationModal'
import { ErrorMessage, Loading } from '../components/PageState'
import Icon from '../components/Icon'
import { useAuth } from '../auth/AuthContext'

export default function HouseholdPage() {
  const { user, updateHouseholdName } = useAuth()
  const [household, setHousehold] = useState<Household | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<HouseholdMember | null>(null)
  const [respondingInvitationId, setRespondingInvitationId] = useState<number | null>(null)
  const [invitationError, setInvitationError] = useState<string | null>(null)

  useEffect(() => {
    householdApi.get()
      .then(value => { setHousehold(value); setName(value.name) })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Could not load your household'))
  }, [])

  async function run(action: () => Promise<Household>) {
    setBusy(true)
    setError(null)
    try {
      setHousehold(await action())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The household could not be updated')
    } finally {
      setBusy(false)
    }
  }

  async function rename(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await householdApi.rename(name)
      setHousehold(updated)
      setName(updated.name)
      updateHouseholdName(updated.id, updated.name)
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The household could not be updated')
    } finally {
      setBusy(false)
    }
  }

  function invite(event: FormEvent) {
    event.preventDefault()
    void run(async () => {
      const updated = await householdApi.invite(email)
      setEmail('')
      return updated
    })
  }

  async function removeMember() {
    if (!removeTarget) return
    setError(null)
    const updated = await householdApi.removeMember(removeTarget.id)
    setHousehold(updated)
    setRemoveTarget(null)
  }

  async function respondToInvitation(id: number, decision: 'accept' | 'reject') {
    setRespondingInvitationId(id)
    setInvitationError(null)
    try {
      if (decision === 'accept') {
        await invitationApi.accept(id)
      } else {
        await invitationApi.reject(id)
      }
      window.location.reload()
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.status === 404) {
        window.location.reload()
        return
      }
      setInvitationError(cause instanceof Error ? cause.message : `Could not ${decision} this invitation`)
      setRespondingInvitationId(null)
    }
  }

  if (!household && !error) return <Loading />
  if (!household) return <ErrorMessage message={error || 'Could not load your household'} />
  const isOwner = household.currentUserRole === 'OWNER'

  return <>
  <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="eyebrow">Shared home</p><h1 className="mt-2 text-4xl">Household</h1><p className="mt-2 text-stone-500">Everyone here shares the same rooms, locations, categories, and items.</p></div>
      <div className="flex items-center gap-2 rounded-full bg-sage px-3.5 py-2 text-sm font-bold text-pine"><Icon name="users" className="h-4 w-4" />Shared space</div>
    </div>

    {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

    <section className="card">
      <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-sage text-pine"><Icon name="home" className="h-4 w-4" /></span><div><h2 className="text-xl">Household details</h2><p className="mt-1 text-sm text-ink-soft">This is the shared space everyone sees.</p></div></div>
      {isOwner ? <>
        <form onSubmit={rename} className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
          <input className="field" aria-label="Household name" maxLength={100} required value={name}
            onChange={event => { setName(event.target.value); setSaved(false) }} />
          <button className="btn-primary" disabled={busy || !name.trim()}>{busy ? 'Saving…' : 'Save'}</button>
        </form>
        {saved && <p role="status" className="mt-2 text-sm text-emerald-700">Household name saved.</p>}
      </> : <p className="mt-3 text-stone-600">{household.name}</p>}
    </section>

    {user && user.pendingInvitations.length > 0 && <section className="card">
      <p className="eyebrow">Incoming</p>
      <h2 className="mt-1 text-xl">Household invitations</h2>
      <p className="mt-1 text-sm text-stone-500">Review invitations here when you’re ready. You’ll stay in your current household until you accept one.</p>
      {invitationError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{invitationError}</p>}
      <div className="mt-4 divide-y">
        {user.pendingInvitations.map(invitation => <div key={invitation.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{invitation.householdName}</p>
            <p className="text-sm text-stone-500">Invitation for {user.email}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" disabled={respondingInvitationId !== null}
              onClick={() => void respondToInvitation(invitation.id, 'reject')}>
              {respondingInvitationId === invitation.id ? 'Updating…' : 'Decline'}
            </button>
            <button type="button" className="btn-primary" disabled={respondingInvitationId !== null}
              onClick={() => void respondToInvitation(invitation.id, 'accept')}>
              {respondingInvitationId === invitation.id ? 'Updating…' : 'Accept'}
            </button>
          </div>
        </div>)}
      </div>
    </section>}

    {isOwner && <section className="card">
      <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-coral/10 text-coral"><Icon name="users" className="h-4 w-4" /></span><div><h2 className="text-xl">Invite someone</h2><p className="mt-1 text-sm text-stone-500">Use the email address they use with Google. They can accept or decline after signing in.</p></div></div>
      <form onSubmit={invite} className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
        <input className="field" type="email" aria-label="Email address" placeholder="family@example.com"
          maxLength={320} required value={email} onChange={event => setEmail(event.target.value)} />
        <button className="btn-primary" disabled={busy || !email.trim()}><Icon name="plus" className="h-4 w-4" />Invite</button>
      </form>
    </section>}

    <section className="card">
      <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cream text-pine"><Icon name="users" className="h-4 w-4" /></span><div><h2 className="text-xl">Members</h2><p className="mt-1 text-sm text-ink-soft">People who can view and update this home.</p></div></div>
      <div className="mt-4 divide-y">
        {household.members.map(member => <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          {member.pictureUrl
            ? <img src={member.pictureUrl} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />
            : <span className="grid h-10 w-10 place-items-center rounded-full bg-stone-100 font-semibold">{(member.displayName || member.email)[0].toUpperCase()}</span>}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{member.displayName || member.email}</p>
            <p className="truncate text-sm text-stone-500">{member.email}</p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">{member.role === 'OWNER' ? 'Owner' : 'Member'}</span>
          {isOwner && member.role !== 'OWNER' && <button type="button" className="btn-danger" disabled={busy}
            onClick={() => setRemoveTarget(member)}>Remove</button>}
        </div>)}
      </div>
    </section>

    {isOwner && household.pendingInvitations.length > 0 && <section className="card">
      <h2 className="text-xl">Pending invitations</h2>
      <div className="mt-4 divide-y">
        {household.pendingInvitations.map(invitation => <div key={invitation.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{invitation.email}</p><p className="text-sm text-stone-500">Waiting for a response</p></div>
          <button type="button" className="btn-secondary" disabled={busy}
            onClick={() => void run(() => householdApi.cancelInvitation(invitation.id))}>Cancel</button>
        </div>)}
      </div>
    </section>}

  </div>

  {removeTarget && <ConfirmationModal
      title={`Remove ${removeTarget.displayName || removeTarget.email}?`}
      description={`${removeTarget.email} will immediately lose access to this household and must be invited again before they can rejoin.`}
      confirmLabel="Remove member"
      confirmingLabel="Removing…"
      errorMessage="Unable to remove this household member. Please try again."
      onClose={() => setRemoveTarget(null)}
      onConfirm={removeMember}
    />}
  </>
}
