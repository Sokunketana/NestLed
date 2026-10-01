import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { categoryApi } from '../../api/categoryApi'
import AddCategoryModal from './AddCategoryModal'

vi.mock('../../api/categoryApi', () => ({
  categoryApi: {
    create: vi.fn(),
  },
}))

beforeAll(() => {
  HTMLDialogElement.prototype.show = function show() { this.open = true }
  HTMLDialogElement.prototype.close = function close() { this.open = false }
})

describe('AddCategoryModal', () => {
  it('closes the custom color picker before the category modal on Escape', () => {
    const onClose = vi.fn()
    render(<AddCategoryModal onClose={onClose} onSaved={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose a custom color' }))

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Custom color picker' }), { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: 'Custom color picker' })).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps the modal open while saving', () => {
    vi.mocked(categoryApi.create).mockReturnValue(new Promise(() => {}))
    const onClose = vi.fn()
    render(<AddCategoryModal onClose={onClose} onSaved={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Electronics'), { target: { value: 'Electronics' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add category' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

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
