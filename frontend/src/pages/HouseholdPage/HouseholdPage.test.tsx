import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import HouseholdPage from './HouseholdPage'
import type { Household } from '../../api/householdApi'

const mocks = vi.hoisted(() => ({
  HOUSEHOLD_SUFFIX: "'s household",
  householdApi: {
    get: vi.fn(),
    rename: vi.fn(),
    invite: vi.fn(),
    cancelInvitation: vi.fn(),
    removeMember: vi.fn(),
    leave: vi.fn(),
    transferOwnership: vi.fn(),
  },
  useAuth: vi.fn(),
  updateHouseholdName: vi.fn(),
}))

vi.mock('../../api/householdApi', () => ({
  HOUSEHOLD_SUFFIX: mocks.HOUSEHOLD_SUFFIX,
  householdApi: mocks.householdApi,
  editableHouseholdName: (name: string) => name.endsWith("'s household") ? name.slice(0, -"'s household".length) : name,
  householdNameWithSuffix: (name: string) => name.endsWith("'s household") ? name : `${name}'s household`,
}))
vi.mock('../../auth/AuthContext', () => ({ useAuth: mocks.useAuth }))

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
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () { this.open = true }
    HTMLDialogElement.prototype.close = function () { this.open = false }
  })

  const member = { id: 3, email: 'member@example.com', displayName: 'Member', role: 'MEMBER' as const }

  it('confirms transfer and removes owner controls after success', async () => {
    const shared = { ...household, members: [...household.members, member] }
    mocks.householdApi.get.mockResolvedValue(shared)
    mocks.householdApi.transferOwnership.mockResolvedValue({
      ...shared, currentUserRole: 'MEMBER',
      members: [{ ...household.members[0], role: 'MEMBER' }, { ...member, role: 'OWNER' }],
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Transfer ownership to Member' }))
    expect(mocks.householdApi.transferOwnership).not.toHaveBeenCalled()
    expect(screen.getByText(/Only the new owner can transfer ownership back/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /^Transfer ownership$/ }))

    await screen.findByText(/Ownership transferred\. You are now a member/)
    expect(mocks.householdApi.transferOwnership).toHaveBeenCalledWith(3)
    expect(screen.queryByRole('button', { name: /^Save$/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Remove$/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Leave household/ })).toBeVisible()
  })

  it('keeps owner controls and displays a failed transfer in the dialog', async () => {
    mocks.householdApi.get.mockResolvedValue({ ...household, members: [...household.members, member] })
    mocks.householdApi.transferOwnership.mockRejectedValue(new Error('Household member was not found'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Transfer ownership to Member' }))
    fireEvent.click(screen.getByRole('button', { name: /^Transfer ownership$/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Household member was not found')
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeVisible()
  })

  it('does not offer transfer to non-owners', async () => {
    mocks.householdApi.get.mockResolvedValue({ ...household, currentUserRole: 'MEMBER', members: [...household.members, member] })
    renderPage()

    await screen.findByRole('button', { name: /Leave household/ })
    expect(screen.queryByRole('button', { name: /Transfer ownership/ })).not.toBeInTheDocument()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.householdApi.get.mockResolvedValue(household)
    mocks.useAuth.mockReturnValue({
      user: { email: 'owner@example.com', pendingInvitations: [] },
      updateHouseholdName: mocks.updateHouseholdName,
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
    expect(screen.getAllByText("'s household")).toHaveLength(1)
    expect(mocks.updateHouseholdName).toHaveBeenCalledWith(1, "Smith's household")
  })
})
