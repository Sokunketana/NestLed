import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import TutorialRequiredModal from './TutorialRequiredModal'

describe('TutorialRequiredModal', () => {
  it('explains why navigation is blocked and returns to setup', () => {
    const onContinue = vi.fn()
    render(<MemoryRouter><TutorialRequiredModal stepLabel="create a room" onContinue={onContinue} /></MemoryRouter>)

    expect(screen.getByRole('dialog', { name: 'Tutorial required' })).toBeVisible()
    expect(screen.getByText(/Finish creating your first room/)).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: /Continue setup/ }))
    expect(onContinue).toHaveBeenCalledOnce()
  })
})
