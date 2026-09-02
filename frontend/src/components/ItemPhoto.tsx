import { useEffect, useState } from 'react'
import { resolvePhotoUrl } from '../api/http'
import ImageLightbox from './ImageLightbox'
import Icon from './Icon'

interface ItemPhotoProps {
  photoUrl?: string | null
  previewUrl?: string | null
  alt: string
  fallbackLabel: string
  className?: string
  loading?: 'eager' | 'lazy'
  cacheKey?: string
  expandable?: boolean
}

export default function ItemPhoto({
  photoUrl,
  previewUrl,
  alt,
  fallbackLabel,
  className = '',
  loading = 'lazy',
  cacheKey,
  expandable = false,
}: ItemPhotoProps) {
  const resolvedPhotoUrl = resolvePhotoUrl(photoUrl)
  let src = previewUrl || resolvedPhotoUrl
  if (!previewUrl && src && cacheKey) {
    const versioned = new URL(src)
    versioned.searchParams.set('v', cacheKey)
    src = versioned.href
  }
  const [failed, setFailed] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)

  useEffect(() => setFailed(false), [src])

  if (!src || failed) {
    return <div className={`grid place-items-center bg-sage/70 text-pine ${className}`} role="img" aria-label={fallbackLabel}>
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/60" aria-hidden="true"><Icon name="box" className="h-5 w-5" /></span>
    </div>
  }

  if (!expandable) {
    return <img className={`block object-cover ${className}`} src={src} alt={alt} loading={loading} onError={() => setFailed(true)} />
  }

  return <>
    <button
      type="button"
      className={`group relative block cursor-zoom-in overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-black focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white ${className}`}
      aria-label={`View larger: ${alt}`}
      aria-haspopup="dialog"
      onClick={() => setShowLightbox(true)}
    >
      <img className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]" src={src} alt={alt} loading={loading} onError={() => setFailed(true)} />
      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition group-hover:bg-black" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m16 16 4 4M11 8v6M8 11h6" />
        </svg>
        View larger
      </span>
    </button>
    {showLightbox && <ImageLightbox src={src} alt={alt} onClose={() => setShowLightbox(false)} />}
  </>
}
