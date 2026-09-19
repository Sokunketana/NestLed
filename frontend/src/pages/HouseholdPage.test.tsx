import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HouseholdPage from './HouseholdPage'
import type { Household } from '../api/householdApi'

const mocks = vi.hoisted(() => ({
  householdApi: {
    get: vi.fn(),
    rename: vi.fn(),
    invite: vi.fn(),
    cancelInvitation: vi.fn(),
    removeMember: vi.fn(),
    leave: vi.fn(),
  },
  useAuth: vi.fn(),
}))

vi.mock('../api/householdApi', () => ({ householdApi: mocks.householdApi }))
vi.mock('../auth/AuthContext', () => ({ useAuth: mocks.useAuth }))

const household: Household = {
  id: 1,
  name: 'Our home',
  currentUserRole: 'OWNER',
  members: [{ id: 1, email: 'owner@example.com', displayName: 'Owner', pictureUrl: null, role: 'OWNER' }],
  pendingInvitations: [{ id: 2, email: 'invitee@example.com', createdAt: '2026-09-17T00:00:00Z' }],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(resolvePromise => { resolve = resolvePromise })
  return { promise, resolve }
}

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter><HouseholdPage /></MemoryRouter>
    </SWRConfig>,
  )
}

describe('HouseholdPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.householdApi.get.mockResolvedValue(household)
    mocks.useAuth.mockReturnValue({
      user: { email: 'owner@example.com', pendingInvitations: [] },
      updateHouseholdName: vi.fn(),
    })
  })

  it('keeps the household details button on Save while an invite is pending', async () => {
    const inviteRequest = deferred<Household>()
    mocks.householdApi.invite.mockReturnValue(inviteRequest.promise)
    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: /^Save$/ })).toBeVisible())
    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), { target: { value: 'new@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /^Invite$/ }))

    await waitFor(() => expect(screen.getByRole('button', { name: /^Invite$/ })).toBeDisabled())
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeEnabled()
    expect(screen.queryByRole('button', { name: /^Saving…$/ })).not.toBeInTheDocument()
    inviteRequest.resolve(household)
  })

  it('keeps the household details button on Save while canceling an invitation', async () => {
    const cancelRequest = deferred<Household>()
    mocks.householdApi.cancelInvitation.mockReturnValue(cancelRequest.promise)
    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: /^Save$/ })).toBeVisible())
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/ }))

    await waitFor(() => expect(screen.getByRole('button', { name: /^Cancel$/ })).toBeDisabled())
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeEnabled()
    expect(screen.queryByRole('button', { name: /^Saving…$/ })).not.toBeInTheDocument()
    cancelRequest.resolve(household)
  })

  it('lets the owner enter a name without typing the household suffix', async () => {
    const updatedHousehold = { ...household, name: "Smith's household" }
    mocks.householdApi.rename.mockResolvedValue(updatedHousehold)
    renderPage()

    const nameInput = await screen.findByRole('textbox', { name: 'Household name' })
    fireEvent.change(nameInput, { target: { value: 'Smith' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))

    await waitFor(() => expect(mocks.householdApi.rename).toHaveBeenCalledWith('Smith'))
    expect(nameInput).toHaveValue('Smith')
    expect(screen.getAllByText("'s household")).toHaveLength(2)
  })
})
