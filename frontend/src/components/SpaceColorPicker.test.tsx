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
  it('opens the app-styled custom picker and applies a hex color', () => {
    const onChange = vi.fn()
    render(<SpaceColorPicker value="#D96F55" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose a custom color' }))

    expect(screen.getByRole('dialog', { name: 'Choose a custom color' })).toBeVisible()
    const hexInput = screen.getByLabelText('Hex color')
    fireEvent.change(hexInput, { target: { value: '#336699' } })
    fireEvent.click(screen.getByRole('button', { name: 'Use this color' }))

    expect(onChange).toHaveBeenCalledWith('#336699')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps an invalid hex value from being applied', () => {
    render(<SpaceColorPicker value="#D96F55" onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose a custom color' }))

    fireEvent.change(screen.getByLabelText('Hex color'), { target: { value: '#NOPE' } })

    expect(screen.getByRole('button', { name: 'Use this color' })).toBeDisabled()
    expect(screen.getByLabelText('Hex color')).toHaveAttribute('aria-invalid', 'true')
  })
})
