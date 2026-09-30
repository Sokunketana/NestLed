import type { ComponentProps } from 'react'

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'secondary'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const variants: Record<ButtonVariant, string> = {
  default: 'bg-pine text-white shadow-sm hover:bg-deep',
  outline: 'border border-line bg-surface text-deep shadow-sm hover:bg-mint',
  ghost: 'text-deep hover:bg-mint',
  secondary: 'bg-sage text-deep hover:bg-[#cde1d6]',
}

const sizes: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-lg px-3',
  lg: 'h-11 rounded-lg px-6',
  icon: 'h-10 w-10',
}

export function buttonVariants({ variant = 'default', size = 'default', className = '' }: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`.trim()
}

export function Button({ variant = 'default', size = 'default', className = '', type = 'button', ...props }: ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return <button data-slot="button" type={type} className={buttonVariants({ variant, size, className })} {...props} />
}
