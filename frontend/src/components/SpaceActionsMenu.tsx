import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

type SpaceActionsMenuProps = {
  name: string
  onDelete: () => void
  onEdit: () => void
}

export default function SpaceActionsMenu({ name, onDelete, onEdit }: SpaceActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  function runAction(action: () => void) {
    setOpen(false)
    action()
  }

  return <div className="relative shrink-0" ref={containerRef} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }}>
    <button
      ref={triggerRef}
      type="button"
      className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 transition hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/30"
      aria-label={`Actions for ${name}`}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen(current => !current)}
    >
      <Icon name="more-horizontal" className="h-4 w-4" />
    </button>
    {open && <div role="menu" aria-label={`Actions for ${name}`} className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-line bg-surface p-1.5 shadow-card">
      <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-ink-soft hover:bg-cream hover:text-ink" onClick={() => runAction(onEdit)}>
        <Icon name="edit" className="h-4 w-4" />Edit
      </button>
      <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => runAction(onDelete)}>
        <Icon name="trash" className="h-4 w-4" />Delete
      </button>
    </div>}
  </div>
}
