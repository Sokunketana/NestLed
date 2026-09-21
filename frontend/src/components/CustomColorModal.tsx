import { KeyboardEvent, PointerEvent, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { getSpaceColor } from '../spaceColors'

type CustomColorModalProps = {
  value: string
  onChange: (color: string) => void
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

export default function CustomColorModal({ value, onChange, onClose }: CustomColorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const colorFieldRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const panelDrag = useRef<PanelDrag | null>(null)
  const onCloseRef = useRef(onClose)
  const initialColor = getSpaceColor(value)
  const [hsv, setHsv] = useState(() => hexToHsv(initialColor))
  const color = hsvToHex(hsv)

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
    onChange(hsvToHex(nextHsv))
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
      aria-label="Custom color picker"
      className="custom-color-panel fixed z-50 max-h-[calc(100dvh-1.5rem)] max-w-sm overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl"
    >
      <div className="p-3 sm:p-4">
        <div
          data-testid="color-panel-drag-handle"
          title="Drag to move"
          className="flex touch-none cursor-grab select-none items-center justify-between active:cursor-grabbing"
          onPointerDown={startPanelDrag}
          onPointerMove={movePanel}
          onPointerUp={stopPanelDrag}
          onPointerCancel={stopPanelDrag}
        >
          <span aria-hidden="true" className="px-2 text-xl leading-none text-stone-400">⠿</span>
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
          className="relative mt-3 aspect-[16/10] w-full touch-none overflow-hidden rounded-2xl shadow-inner ring-1 ring-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
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

        <input
          aria-label="Hue"
          className="color-hue-slider mt-4"
          type="range"
          min="0"
          max="359"
          value={hsv.h}
          onChange={event => setColor({ ...hsv, h: Number(event.target.value) })}
        />
      </div>
    </dialog>
  )
}
