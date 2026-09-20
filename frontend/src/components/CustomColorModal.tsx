import { KeyboardEvent, PointerEvent, useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon'
import { getSpaceColor, isSpaceColor } from '../spaceColors'

type CustomColorModalProps = {
  value: string
  onApply: (color: string) => void
  onClose: () => void
}

type HsvColor = { h: number; s: number; v: number }
type PanelDrag = { pointerId: number; offsetX: number; offsetY: number }

function hexToHsv(hex: string): HsvColor {
  const red = parseInt(hex.slice(1, 3), 16) / 255
  const green = parseInt(hex.slice(3, 5), 16) / 255
  const blue = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let hue = 0

  if (delta) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6)
    else if (max === green) hue = 60 * ((blue - red) / delta + 2)
    else hue = 60 * ((red - green) / delta + 4)
  }

  return {
    h: Math.round(hue < 0 ? hue + 360 : hue),
    s: max ? Math.round((delta / max) * 100) : 0,
    v: Math.round(max * 100),
  }
}

function hsvToHex({ h, s, v }: HsvColor) {
  const saturation = s / 100
  const brightness = v / 100
  const chroma = brightness * saturation
  const segment = h / 60
  const x = chroma * (1 - Math.abs((segment % 2) - 1))
  const [red, green, blue] = segment < 1 ? [chroma, x, 0]
    : segment < 2 ? [x, chroma, 0]
      : segment < 3 ? [0, chroma, x]
        : segment < 4 ? [0, x, chroma]
          : segment < 5 ? [x, 0, chroma]
            : [chroma, 0, x]
  const match = brightness - chroma
  return `#${[red, green, blue].map(channel => Math.round((channel + match) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

export default function CustomColorModal({ value, onApply, onClose }: CustomColorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const colorFieldRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const panelDrag = useRef<PanelDrag | null>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const descriptionId = useId()
  const initialColor = getSpaceColor(value)
  const [hsv, setHsv] = useState(() => hexToHsv(initialColor))
  const [hexInput, setHexInput] = useState(initialColor)
  const color = isSpaceColor(hexInput) ? hexInput.toUpperCase() : hsvToHex(hsv)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog?.show()
    colorFieldRef.current?.focus()

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    const keepPanelInViewport = () => {
      if (!dialog?.style.top) return
      const bounds = dialog.getBoundingClientRect()
      const left = Math.max(8, Math.min(bounds.left, window.innerWidth - bounds.width - 8))
      const top = Math.max(8, Math.min(bounds.top, window.innerHeight - bounds.height - 8))
      dialog.style.left = `${left}px`
      dialog.style.top = `${top}px`
    }
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', keepPanelInViewport)

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', keepPanelInViewport)
      if (dialog?.open) dialog.close()
      if (dialog?.contains(document.activeElement)) previouslyFocused?.focus()
    }
  }, [])

  function setColor(nextHsv: HsvColor) {
    setHsv(nextHsv)
    setHexInput(hsvToHex(nextHsv))
  }

  function updateFromPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const saturation = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))
    const brightness = Math.max(0, Math.min(100, (1 - (event.clientY - bounds.top) / bounds.height) * 100))
    setColor({ ...hsv, s: Math.round(saturation), v: Math.round(brightness) })
  }

  function moveColorWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 2
    let next: HsvColor
    if (event.key === 'ArrowLeft') next = { ...hsv, s: Math.max(0, hsv.s - step) }
    else if (event.key === 'ArrowRight') next = { ...hsv, s: Math.min(100, hsv.s + step) }
    else if (event.key === 'ArrowDown') next = { ...hsv, v: Math.max(0, hsv.v - step) }
    else if (event.key === 'ArrowUp') next = { ...hsv, v: Math.min(100, hsv.v + step) }
    else return
    event.preventDefault()
    setColor(next)
  }

  function updateHex(nextValue: string) {
    const normalized = nextValue.startsWith('#') ? nextValue : `#${nextValue}`
    setHexInput(normalized.toUpperCase())
    if (isSpaceColor(normalized)) setHsv(hexToHsv(normalized))
  }

  function startPanelDrag(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return
    const panel = dialogRef.current
    if (!panel) return
    const bounds = panel.getBoundingClientRect()
    panelDrag.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    }
    panel.style.width = `${bounds.width}px`
    panel.style.left = `${bounds.left}px`
    panel.style.top = `${bounds.top}px`
    panel.style.right = 'auto'
    panel.style.bottom = 'auto'
    panel.style.margin = '0'
    panel.style.transform = 'none'
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function movePanel(event: PointerEvent<HTMLDivElement>) {
    const drag = panelDrag.current
    const panel = dialogRef.current
    if (!drag || !panel || drag.pointerId !== event.pointerId) return
    const left = Math.max(8, Math.min(event.clientX - drag.offsetX, window.innerWidth - panel.offsetWidth - 8))
    const top = Math.max(8, Math.min(event.clientY - drag.offsetY, window.innerHeight - panel.offsetHeight - 8))
    panel.style.left = `${left}px`
    panel.style.top = `${top}px`
  }

  function stopPanelDrag(event: PointerEvent<HTMLDivElement>) {
    if (panelDrag.current?.pointerId !== event.pointerId) return
    panelDrag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="custom-color-panel fixed z-50 max-h-[calc(100dvh-1.5rem)] max-w-md overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl"
    >
      <div className="p-5 sm:p-7">
        <div
          data-testid="color-panel-drag-handle"
          title="Drag to move"
          className="flex touch-none cursor-grab select-none items-start justify-between gap-4 active:cursor-grabbing"
          onPointerDown={startPanelDrag}
          onPointerMove={movePanel}
          onPointerUp={stopPanelDrag}
          onPointerCancel={stopPanelDrag}
        >
          <div>
            <p className="eyebrow flex items-center gap-2"><span aria-hidden="true" className="text-base leading-none text-stone-400">⠿</span> Make it yours</p>
            <h2 id={titleId} className="mt-1 text-2xl">Choose a custom color</h2>
            <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-ink-soft">Pick from the color field or enter an exact hex value. You can keep using the page while this panel is open.</p>
          </div>
          <button type="button" className="btn-secondary h-9 w-9 shrink-0 p-0" onClick={onClose} aria-label="Close color picker">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={colorFieldRef}
          role="slider"
          tabIndex={0}
          aria-label="Color saturation and brightness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={hsv.s}
          aria-valuetext={`${hsv.s}% saturation, ${hsv.v}% brightness`}
          className="relative mt-6 aspect-[16/10] w-full touch-none overflow-hidden rounded-2xl shadow-inner ring-1 ring-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
          onPointerDown={event => {
            isDragging.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
            updateFromPointer(event)
          }}
          onPointerMove={event => { if (isDragging.current) updateFromPointer(event) }}
          onPointerUp={event => {
            isDragging.current = false
            event.currentTarget.releasePointerCapture(event.pointerId)
          }}
          onPointerCancel={() => { isDragging.current = false }}
          onKeyDown={moveColorWithKeyboard}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_1px_5px_rgba(0,0,0,.55)]"
            style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: color }}
          />
        </div>

        <label className="label mt-5" htmlFor={`${titleId}-hue`}>Hue</label>
        <input
          id={`${titleId}-hue`}
          aria-label="Hue"
          className="color-hue-slider"
          type="range"
          min="0"
          max="359"
          value={hsv.h}
          onChange={event => setColor({ ...hsv, h: Number(event.target.value) })}
        />

        <div className="mt-5 flex items-end gap-3">
          <span className="h-12 w-12 shrink-0 rounded-xl border-4 border-white shadow-sm ring-1 ring-line" style={{ backgroundColor: color }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <label className="label" htmlFor={`${titleId}-hex`}>Hex color</label>
            <input
              id={`${titleId}-hex`}
              className={`field font-mono uppercase ${isSpaceColor(hexInput) ? '' : 'border-red-400 focus:border-red-500'}`}
              value={hexInput}
              maxLength={7}
              spellCheck={false}
              aria-invalid={!isSpaceColor(hexInput)}
              onChange={event => updateHex(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" disabled={!isSpaceColor(hexInput)} onClick={() => onApply(color)}>
            <Icon name="check" className="h-4 w-4" />
            Use this color
          </button>
        </div>
      </div>
    </dialog>
  )
}
