import { useEffect, useId, useRef } from 'react'

type ImageLightboxProps = {
  src: string
  alt: string
  onClose: () => void
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null

    dialog?.showModal()
    closeButtonRef.current?.focus()

    return () => {
      if (dialog?.open) dialog.close()
      previouslyFocused?.focus()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto h-[100dvh] w-screen max-h-none max-w-none border-0 bg-transparent p-4 text-white backdrop:bg-black/80 backdrop:backdrop-blur-sm sm:p-8"
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }}
    >
      <div className="relative flex h-full w-full items-center justify-center" onClick={onClose}>
        <h2 id={titleId} className="sr-only">Enlarged image</h2>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close enlarged image"
          className="absolute right-0 top-0 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/70 text-white shadow-lg transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          onClick={event => { event.stopPropagation(); onClose() }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
            <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
        <img
          src={src}
          alt={alt}
          className="block max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
          onClick={event => event.stopPropagation()}
        />
      </div>
    </dialog>
  )
}
