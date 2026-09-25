// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import SpaceColorPicker from './SpaceColorPicker'

beforeAll(() => {
  HTMLDialogElement.prototype.show = function show() {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close() {
    this.open = false
  }
})

describe('SpaceColorPicker', () => {
  it('opens the app-styled custom picker and applies color changes live', () => {
    const onChange = vi.fn()
    render(<SpaceColorPicker value="#D96F55" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose a custom color' }))

    expect(screen.getByRole('dialog', { name: 'Custom color picker' })).toBeVisible()
    fireEvent.change(screen.getByLabelText('Hue'), { target: { value: '210' } })

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0]?.[0]).toMatch(/^#[0-9A-F]{6}$/)
    expect(screen.getByRole('dialog', { name: 'Custom color picker' })).toBeVisible()
  })

  it('closes from the icon-only close control', () => {
    render(<SpaceColorPicker value="#D96F55" onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose a custom color' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close color picker' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
