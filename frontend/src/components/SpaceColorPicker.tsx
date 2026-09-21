import { useState } from 'react'
import Icon from './Icon'
import CustomColorModal from './CustomColorModal'
import { getSpaceColor, isSpaceColor, spaceColorOptions } from '../spaceColors'

type SpaceColorPickerProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function SpaceColorPicker({ value, onChange, disabled = false }: SpaceColorPickerProps) {
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false)
  const currentColor = getSpaceColor(value)
  const selectedPreset = spaceColorOptions.find(option => option.value.toLowerCase() === currentColor.toLowerCase())
  const customColorSelected = isSpaceColor(value) && !selectedPreset

  return <fieldset disabled={disabled}>
    <legend className="label">Color</legend>
    <div className="flex flex-wrap items-center gap-2">
      {spaceColorOptions.map(option => {
        const selected = option.value.toLowerCase() === currentColor.toLowerCase()
        return <button
          key={option.value}
          type="button"
          title={option.label}
          aria-label={`${option.label} color`}
          aria-pressed={selected}
          className={`grid h-8 w-8 place-items-center rounded-full border-2 border-white shadow-sm ring-1 ring-line transition hover:scale-105 ${selected ? 'ring-2 ring-deep ring-offset-1' : ''}`}
          style={{ backgroundColor: option.value }}
          onClick={() => onChange(option.value)}
        >
          {selected && <Icon name="check" className="h-4 w-4 text-white drop-shadow" />}
        </button>
      })}
      <button
        type="button"
        title="Custom color"
        className="relative grid h-8 w-8 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-white bg-cream text-sm font-bold text-ink-soft shadow-sm ring-1 ring-line transition hover:scale-105"
        style={customColorSelected ? { backgroundColor: currentColor } : undefined}
        aria-label="Choose a custom color"
        aria-pressed={customColorSelected}
        onClick={() => setIsCustomPickerOpen(true)}
      >
        {customColorSelected ? <Icon name="check" className="h-4 w-4 text-white drop-shadow" /> : <span>+</span>}
      </button>
    </div>
    <p className="mt-2 text-xs text-ink-soft">{selectedPreset?.label || `Custom color ${currentColor}`} <span className="text-stone-300">·</span> You can change this later.</p>
    {isCustomPickerOpen && <CustomColorModal
      value={currentColor}
      onClose={() => setIsCustomPickerOpen(false)}
      onChange={onChange}
    />}
  </fieldset>
}
