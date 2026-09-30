import type { ComponentProps } from 'react'

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return <div data-slot="card" className={`rounded-xl border border-line bg-surface text-ink shadow-sm ${className}`} {...props} />
}

export function CardHeader({ className = '', ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-header" className={`flex flex-col gap-1.5 p-6 ${className}`} {...props} />
}

export function CardTitle({ className = '', ...props }: ComponentProps<'h3'>) {
  return <h3 data-slot="card-title" className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
}

export function CardDescription({ className = '', ...props }: ComponentProps<'p'>) {
  return <p data-slot="card-description" className={`text-sm leading-relaxed text-ink-soft ${className}`} {...props} />
}

export function CardContent({ className = '', ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={`p-6 pt-0 ${className}`} {...props} />
}
