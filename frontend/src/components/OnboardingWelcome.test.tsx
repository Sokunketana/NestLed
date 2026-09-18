import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import OnboardingWelcome from './OnboardingWelcome'

describe('OnboardingWelcome', () => {
  it('explains the setup flow before starting the guide', () => {
    const onStart = vi.fn()
    render(<MemoryRouter><OnboardingWelcome onStart={onStart} /></MemoryRouter>)

    expect(screen.getByRole('dialog', { name: 'Welcome to Nestled' })).toBeVisible()
    expect(screen.getByText('Create a room')).toBeVisible()
    expect(screen.getByText('Add a location')).toBeVisible()
    expect(screen.getByText('Create a category')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: /Start setup/ }))
    expect(onStart).toHaveBeenCalledOnce()
  })
})
