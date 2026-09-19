import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SpaceActionsMenu from './SpaceActionsMenu'

describe('SpaceActionsMenu', () => {
  it('opens the menu and runs an edit action', () => {
    const onEdit = vi.fn()
    render(<SpaceActionsMenu name="Bedroom" onEdit={onEdit} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Bedroom' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger', () => {
    render(<SpaceActionsMenu name="Top drawer" onEdit={vi.fn()} onDelete={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: 'Actions for Top drawer' })

    fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
