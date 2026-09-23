import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SpaceActionsMenu from './SpaceActionsMenu'

describe('SpaceActionsMenu', () => {
  it('opens the menu without focusing an item and runs an edit action', async () => {
    const onEdit = vi.fn()
    render(<SpaceActionsMenu name="Bedroom" onEdit={onEdit} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Bedroom' }))
    await waitFor(() => expect(screen.getByRole('menu')).toHaveFocus())
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger', () => {
    render(<SpaceActionsMenu name="Top drawer" onEdit={vi.fn()} onDelete={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: 'Actions for Top drawer' })

    fireEvent.click(trigger)
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('supports an optional move action', () => {
    const onMove = vi.fn()
    render(<SpaceActionsMenu name="Passport" onEdit={vi.fn()} onDelete={vi.fn()} onMove={onMove} />)

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Passport' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Move' }))

    expect(onMove).toHaveBeenCalledOnce()
  })
})
