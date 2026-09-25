import { createContext, forwardRef, useContext, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent } from 'react'
import type { DropdownMenuContentProps, DropdownMenuContextValue, DropdownMenuItemProps, DropdownMenuProps } from './dropdown-menu.type'

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null)

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext)
  if (!context) throw new Error('DropdownMenu components must be used inside DropdownMenu')
  return context
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const contentId = useId()

  return <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentId }}>
    <div className="relative shrink-0" data-slot="dropdown-menu">{children}</div>
  </DropdownMenuContext.Provider>
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<'button'>>(
  function DropdownMenuTrigger({ className = '', onClick, ...props }, forwardedRef) {
    const { open, setOpen, triggerRef, contentId } = useDropdownMenu()

    function setRefs(element: HTMLButtonElement | null) {
      triggerRef.current = element
      if (typeof forwardedRef === 'function') forwardedRef(element)
      else if (forwardedRef) forwardedRef.current = element
    }

    return <button
      ref={setRefs}
      type="button"
      data-slot="dropdown-menu-trigger"
      data-state={open ? 'open' : 'closed'}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? contentId : undefined}
      className={className}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented) setOpen(!open)
      }}
      {...props}
    />
  },
)

export function DropdownMenuContent({ className = '', onEscapeKeyDown, onKeyDown, onBlur, ...props }: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef, contentId } = useDropdownMenu()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node
      if (!contentRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false)
    }

    function focusMenu() {
      contentRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    const frame = requestAnimationFrame(focusMenu)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      cancelAnimationFrame(frame)
    }
  }, [open, setOpen, triggerRef])

  if (!open) return null

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(contentRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
    const activeIndex = items.indexOf(document.activeElement as HTMLButtonElement)

    if (event.key === 'Escape') {
      event.preventDefault()
      onEscapeKeyDown?.(event)
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (event.key === 'Tab') {
      setOpen(false)
      return
    }
    if (!items.length || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      onKeyDown?.(event)
      return
    }

    event.preventDefault()
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[nextIndex]?.focus()
    onKeyDown?.(event)
  }

  return <div
    ref={contentRef}
    id={contentId}
    role="menu"
    aria-orientation="vertical"
    tabIndex={-1}
    data-slot="dropdown-menu-content"
    data-state="open"
    className={`absolute right-0 top-full z-20 mt-1.5 min-w-36 overflow-hidden rounded-xl border border-line bg-surface p-1.5 text-ink shadow-card outline-none ${className}`}
    onKeyDown={handleKeyDown}
    onBlur={event => {
      onBlur?.(event)
      const target = event.relatedTarget as Node | null
      if (!target || (!contentRef.current?.contains(target) && !triggerRef.current?.contains(target))) setOpen(false)
    }}
    {...props}
  />
}

export function DropdownMenuItem({ className = '', onClick, onSelect, variant = 'default', ...props }: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenu()
  const variantClass = variant === 'destructive'
    ? 'text-red-700 hover:bg-red-50 hover:text-red-800'
    : 'text-ink-soft hover:bg-cream hover:text-ink'

  return <button
    type="button"
    role="menuitem"
    tabIndex={-1}
    data-slot="dropdown-menu-item"
    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold outline-none transition focus:bg-cream focus:text-ink ${variantClass} ${className}`}
    onClick={event => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        onSelect?.()
        setOpen(false)
      }
    }}
    {...props}
  />
}

export function DropdownMenuSeparator({ className = '', ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div role="separator" data-slot="dropdown-menu-separator" className={`-mx-1 my-1 h-px bg-line ${className}`} {...props} />
}
