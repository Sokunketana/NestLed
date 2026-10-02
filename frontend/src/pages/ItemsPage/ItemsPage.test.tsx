import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ItemsPage from './ItemsPage'

const mocks = vi.hoisted(() => ({ search: vi.fn(), list: vi.fn() }))
vi.mock('../../api/itemApi', () => ({ itemApi: mocks }))
vi.mock('../../api/roomApi', () => ({ roomApi: { list: async () => [] } }))
vi.mock('../../api/categoryApi', () => ({ categoryApi: { list: async () => [] } }))
vi.mock('../../api/storageLocationApi', () => ({ storageLocationApi: { list: async () => [] } }))

function renderPage(url: string) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter initialEntries={[url]}><ItemsPage /></MemoryRouter>
    </SWRConfig>,
  )
}

describe('ItemsPage search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.list.mockResolvedValue([])
    mocks.search.mockImplementation(async (_name: string, page: number) => ({
      content: [], page, size: 20, hasNext: page === 0,
    }))
  })

  it.each(['', 'a', '%20a%20', '%20%20'])('rejects a short query %s without requesting items', async query => {
    renderPage(`/items?q=${query}`)
    expect(await screen.findByText('Search name must contain at least 2 characters')).toBeVisible()
    expect(mocks.search).not.toHaveBeenCalled()
    expect(mocks.list).not.toHaveBeenCalled()
  })

  it('trims the query and loads separate next and previous pages', async () => {
    mocks.search.mockImplementation(async (_name: string, page: number) => ({
      content: [{
        id: page + 1, name: page === 0 ? 'Passport' : 'Paint', quantity: 1,
        roomName: 'Office', storageLocationName: 'Shelf', categoryName: 'Supplies',
      }],
      page, size: 20, hasNext: page === 0,
    }))
    renderPage('/items?q=%20pa%20')
    const next = await screen.findByRole('button', { name: 'Next' })
    expect(mocks.search).toHaveBeenCalledWith('pa', 0)
    expect(screen.getByRole('link', { name: /Passport/ })).toHaveAttribute('href', '/items/1')
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    fireEvent.click(next)
    await waitFor(() => expect(mocks.search).toHaveBeenCalledWith('pa', 1))
    expect(await screen.findByText('Page 2')).toBeVisible()
    expect(screen.getByRole('link', { name: /Paint/ })).toHaveAttribute('href', '/items/2')
    expect(screen.queryByRole('link', { name: /Passport/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(await screen.findByText('Page 1')).toBeVisible()
    expect(mocks.list).not.toHaveBeenCalled()
  })

  it('keeps the ordinary item list available without a query', async () => {
    renderPage('/items')
    await screen.findByText('No items match this view. Add one or try different filters.')
    expect(mocks.list).toHaveBeenCalled()
    expect(mocks.search).not.toHaveBeenCalled()
    expect(screen.queryByRole('navigation', { name: 'Search results pages' })).not.toBeInTheDocument()
  })
})
