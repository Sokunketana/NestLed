import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Empty, ErrorMessage, Loading } from './PageState'

describe('page state components', () => {
  it('announces loading state accessibly', () => {
    render(<Loading />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading your inventory…')
  })

  it('renders an error message', () => {
    render(<ErrorMessage message="Could not load items" />)

    expect(screen.getByText('Could not load items')).toBeVisible()
  })

  it('renders empty-state content', () => {
    render(<Empty>No items found</Empty>)

    expect(screen.getByText('No items found')).toBeVisible()
  })
})
