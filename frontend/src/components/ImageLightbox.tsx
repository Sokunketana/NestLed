import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

type ImageLightboxProps = {
  src: string
  alt: string
  onClose: () => void
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const [zoom, setZoom] = useState(1)

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

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2
    viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2
  }, [zoom])

  function adjustZoom(amount: number) {
    setZoom(current => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + amount)))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      adjustZoom(ZOOM_STEP)
    } else if (event.key === '-') {
      event.preventDefault()
      adjustZoom(-ZOOM_STEP)
    } else if (event.key === '0') {
      event.preventDefault()
      setZoom(1)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto h-[100dvh] w-screen max-h-none max-w-none border-0 bg-transparent p-4 text-white backdrop:bg-black/80 backdrop:backdrop-blur-sm sm:p-8"
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
      onKeyDown={handleKeyDown}
    >
      <div ref={viewportRef} className="relative h-full w-full overflow-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <h2 id={titleId} className="sr-only">Enlarged image</h2>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close enlarged image"
          className="fixed right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/70 text-white shadow-lg transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:right-8 sm:top-8"
          onClick={event => { event.stopPropagation(); onClose() }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
            <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
        <div
          className="flex min-h-full min-w-full items-center justify-center"
          style={{ width: `${Math.max(zoom, 1) * 100}%`, height: `${Math.max(zoom, 1) * 100}%` }}
          onClick={onClose}
        >
          <img
            src={src}
            alt={alt}
            className="block max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] rounded-2xl object-contain shadow-2xl transition-transform duration-200 sm:max-h-[calc(100dvh-4rem)] sm:max-w-[calc(100vw-4rem)]"
            style={{ transform: `scale(${zoom})` }}
            onClick={event => event.stopPropagation()}
          />
        </div>
        <div
          role="group"
          aria-label="Image zoom controls"
          className="fixed bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center overflow-hidden rounded-full bg-black/75 text-white shadow-xl backdrop-blur-sm sm:bottom-7"
          onClick={event => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Zoom out"
            aria-keyshortcuts="-"
            title="Zoom out (−)"
            className="grid h-11 w-12 place-items-center text-xl transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => adjustZoom(-ZOOM_STEP)}
          >
            <span aria-hidden="true">−</span>
          </button>
          <button
            type="button"
            aria-label="Reset zoom to 100%"
            aria-keyshortcuts="0"
            title="Reset zoom (0)"
            className="h-11 min-w-16 border-x border-white/20 px-3 text-sm font-semibold transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            aria-keyshortcuts="+"
            title="Zoom in (+)"
            className="grid h-11 w-12 place-items-center text-xl transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => adjustZoom(ZOOM_STEP)}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>
    </dialog>
  )
}
