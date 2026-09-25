import type { HTMLAttributes } from 'react'

export type BrandLogoProps = HTMLAttributes<HTMLSpanElement> & {
  householdName?: string | null
  showHousehold?: boolean
  size?: 'default' | 'large'
}

