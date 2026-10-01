import { useEffect, useRef } from 'react'

export default function useModalEscape(onClose: () => void, disabled = false) {
  const modalRef = useRef<HTMLElement>(null)

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const dialogs = document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]')
      if (dialogs[dialogs.length - 1] !== modalRef.current) return
      event.preventDefault()
      if (!disabled) onClose()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [disabled, onClose])

  return modalRef
}
