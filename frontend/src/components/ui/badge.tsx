import type { ComponentProps } from 'react'

type BadgeVariant = 'default' | 'secondary' | 'outline'

const variants: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-pine text-white',
  secondary: 'border-transparent bg-sage text-deep',
  outline: 'border-line bg-surface text-deep',
}

export function Badge({ variant = 'default', className = '', ...props }: ComponentProps<'span'> & { variant?: BadgeVariant }) {
  return <span data-slot="badge" className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${variants[variant]} ${className}`} {...props} />
}
