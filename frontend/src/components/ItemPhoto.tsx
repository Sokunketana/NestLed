import { useEffect, useState } from 'react'
import { resolvePhotoUrl } from '../api/http'

interface ItemPhotoProps {
  photoUrl?: string | null
  previewUrl?: string | null
  alt: string
  fallbackLabel: string
  className?: string
  loading?: 'eager' | 'lazy'
  cacheKey?: string
}

export default function ItemPhoto({
  photoUrl,
  previewUrl,
  alt,
  fallbackLabel,
  className = '',
  loading = 'lazy',
  cacheKey,
}: ItemPhotoProps) {
  const resolvedPhotoUrl = resolvePhotoUrl(photoUrl)
  let src = previewUrl || resolvedPhotoUrl
  if (!previewUrl && src && cacheKey) {
    const versioned = new URL(src)
    versioned.searchParams.set('v', cacheKey)
    src = versioned.href
  }
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [src])

  if (!src || failed) {
    return <div className={`grid place-items-center bg-sage text-2xl text-pine ${className}`} role="img" aria-label={fallbackLabel}>
      <span aria-hidden="true">◇</span>
    </div>
  }

  return <img className={`block object-cover ${className}`} src={src} alt={alt} loading={loading} onError={() => setFailed(true)} />
}
