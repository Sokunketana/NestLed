import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import SetupGuide from './SetupGuide'

describe('SetupGuide', () => {
  it('points a new household to the room quick-add area', () => {
    render(<MemoryRouter><SetupGuide data={{ rooms: [], locations: [], categories: [] }} /></MemoryRouter>)

    expect(screen.queryByText('Step 1 of 3')).not.toBeInTheDocument()
    expect(screen.getByText('Next: Create a room.')).toBeVisible()
    const tutorialHint = screen.getByRole('complementary', { name: 'Tutorial hint' })
    expect(tutorialHint).toBeVisible()
    expect(screen.getByText('Your first mission: create a room')).toBeVisible()
    expect(within(tutorialHint).getByText(/Open Quick add, choose Add room/)).toBeVisible()
    expect(screen.getByRole('link', { name: /Show me/ })).toHaveAttribute('href', '/rooms?setup=room#quick-add')
  })

  it('moves the guide to categories after rooms and locations exist', () => {
    render(<MemoryRouter><SetupGuide data={{
      rooms: [{ id: 1, name: 'Bedroom', itemCount: 0 }],
      locations: [{ id: 2, name: 'Top drawer', roomId: 1, roomName: 'Bedroom', itemCount: 0 }],
      categories: [],
    }} /></MemoryRouter>)

    expect(screen.getByText('Next: Add a category.')).toBeVisible()
    expect(screen.getByRole('link', { name: /Show me/ })).toHaveAttribute('href', '/categories#category-form')
  })
})
