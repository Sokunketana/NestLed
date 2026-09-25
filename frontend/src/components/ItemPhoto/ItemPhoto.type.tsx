export type ItemPhotoProps = {
  photoUrl?: string | null
  previewUrl?: string | null
  alt: string
  fallbackLabel: string
  className?: string
  loading?: 'eager' | 'lazy'
  cacheKey?: string
  expandable?: boolean
}
