import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { SelectContentProps, SelectContextValue, SelectItemProps, SelectProps, SelectTriggerProps, SelectValueProps } from './select.type'

const SelectContext = createContext<SelectContextValue | null>(null)

function useSelect() {
  const context = useContext(SelectContext)
  if (!context) throw new Error('Select components must be used inside Select')
  return context
}

export function Select({
  children,
  value,
  defaultValue = '',
  onValueChange,
  disabled = false,
  required = false,
  name,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [labels, setLabels] = useState<Record<string, string>>({})
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const contentId = useId()
  const currentValue = value ?? internalValue

  const registerLabel = useCallback((itemValue: string, label: string) => {
    setLabels(current => current[itemValue] === label ? current : { ...current, [itemValue]: label })
  }, [])

  const unregisterLabel = useCallback((itemValue: string) => {
    setLabels(current => {
      if (!(itemValue in current)) return current
      const next = { ...current }
      delete next[itemValue]
      return next
    })
  }, [])

  const handleValueChange = useCallback((nextValue: string) => {
    setInternalValue(nextValue)
    onValueChange?.(nextValue)
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [onValueChange])

  function handleSubmitCapture(event: FormEvent<HTMLDivElement>) {
    if (!required || currentValue) return
    event.preventDefault()
    event.stopPropagation()
    triggerRef.current?.focus()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  return (
    <SelectContext.Provider value={{
      value: currentValue,
      onValueChange: handleValueChange,
      open,
      setOpen,
      disabled,
      required,
      triggerRef,
      rootRef,
      contentId,
      labels,
      registerLabel,
      unregisterLabel,
    }}>
      <div ref={rootRef} data-slot="select" className="relative w-full" onSubmitCapture={handleSubmitCapture}>
        {children}
        {name && <input type="hidden" name={name} value={currentValue} />}
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ className = '', children, onClick, onKeyDown, ...props }, forwardedRef) {
    const { value, open, setOpen, disabled, required, triggerRef, contentId } = useSelect()

    function setRefs(element: HTMLButtonElement | null) {
      triggerRef.current = element
      if (typeof forwardedRef === 'function') forwardedRef(element)
      else if (forwardedRef) forwardedRef.current = element
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      onKeyDown?.(event)
      if (event.defaultPrevented || disabled) return
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault()
        setOpen(true)
      }
    }

    return (
      <button
        ref={setRefs}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={contentId}
        aria-haspopup="listbox"
        aria-required={required || undefined}
        aria-disabled={disabled || undefined}
        data-slot="select-trigger"
        data-state={open ? 'open' : 'closed'}
        data-value={value || undefined}
        className={`field flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={event => {
          onClick?.(event)
          if (!event.defaultPrevented && !disabled) setOpen(!open)
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        {...props}
      >
        <span className="min-w-0 flex-1 truncate">{children}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>
    )
  },
)

export function SelectValue({ placeholder = 'Select an option', className = '' }: SelectValueProps) {
  const { value, labels } = useSelect()
  return <span className={className}>{value ? labels[value] ?? value : <span className="text-stone-400">{placeholder}</span>}</span>
}

export function SelectContent({ className = '', children, onKeyDown, ...props }: SelectContentProps) {
  const { value, open, setOpen, triggerRef, contentId } = useSelect()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      const options = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])
      const selected = options.find(option => option.dataset.value === value)
      const first = options.find(option => option.getAttribute('aria-disabled') !== 'true')
      ;(selected && selected.getAttribute('aria-disabled') !== 'true' ? selected : first)?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open, value])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (event.key === 'Tab') {
      setOpen(false)
      return
    }

    const items = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])') ?? [])
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && items.length) {
      event.preventDefault()
      const activeIndex = items.indexOf(document.activeElement as HTMLElement)
      const nextIndex = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
      items[nextIndex]?.focus()
    }
    onKeyDown?.(event)
  }

  return (
    <div
      ref={contentRef}
      id={contentId}
      role="listbox"
      tabIndex={-1}
      aria-hidden={!open || undefined}
      data-slot="select-content"
      data-state={open ? 'open' : 'closed'}
      className={`${open ? '' : 'hidden '}absolute left-0 top-full z-50 mt-1 max-h-60 w-full min-w-36 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 text-ink shadow-card outline-none ${className}`}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  )
}

export function SelectItem({ value, className = '', children, disabled = false, onClick, onKeyDown, ...props }: SelectItemProps) {
  const { value: selectedValue, onValueChange, disabled: selectDisabled, registerLabel, unregisterLabel } = useSelect()
  const itemDisabled = disabled || selectDisabled
  const label = typeof children === 'string' ? children : value

  useEffect(() => {
    registerLabel(value, label)
    return () => unregisterLabel(value)
  }, [label, registerLabel, unregisterLabel, value])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented || itemDisabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onValueChange(value)
    }
  }

  return (
    <button
      type="button"
      role="option"
      aria-selected={selectedValue === value}
      aria-disabled={itemDisabled || undefined}
      tabIndex={-1}
      data-slot="select-item"
      data-value={value}
      className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm outline-none transition ${selectedValue === value ? 'bg-mint font-semibold text-pine' : 'text-ink-soft'} ${itemDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-cream hover:text-ink focus:bg-cream focus:text-ink'} ${className}`}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented && !itemDisabled) onValueChange(value)
      }}
      onKeyDown={handleKeyDown}
      disabled={itemDisabled}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {selectedValue === value && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-2 h-4 w-4 shrink-0" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" /></svg>}
    </button>
  )
}

export function SelectGroup({ children, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div role="group" {...props}>{children}</div>
}

export function SelectLabel({ children, className = '', ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={`px-3 py-1.5 text-xs font-semibold text-stone-400 ${className}`} {...props}>{children}</div>
}

export function SelectSeparator({ className = '', ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div role="separator" className={`-mx-1 my-1 h-px bg-line ${className}`} {...props} />
}
