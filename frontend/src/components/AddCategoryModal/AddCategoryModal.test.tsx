import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { categoryApi } from '../../api/categoryApi'
import AddCategoryModal from './AddCategoryModal'

vi.mock('../../api/categoryApi', () => ({
  categoryApi: {
    create: vi.fn(),
  },
}))

describe('AddCategoryModal', () => {
  it('creates a category and returns it to the item form', async () => {
    const category = { id: 8, name: 'Electronics', color: '#145247', itemCount: 0 }
    vi.mocked(categoryApi.create).mockResolvedValue(category)
    const onSaved = vi.fn()

    render(<AddCategoryModal onClose={vi.fn()} onSaved={onSaved} />)
    fireEvent.change(screen.getByPlaceholderText('Electronics'), { target: { value: ' Electronics ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add category' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(category))
    expect(categoryApi.create).toHaveBeenCalledWith({ name: 'Electronics', color: '#145247' })
  })
})
