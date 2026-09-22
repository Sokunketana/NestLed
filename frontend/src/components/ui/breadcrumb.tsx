import type { ComponentProps, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../Icon'

export function Breadcrumb(props: ComponentProps<'nav'>) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

export function BreadcrumbList({ className = '', ...props }: ComponentProps<'ol'>) {
  return <ol data-slot="breadcrumb-list" className={`flex items-center gap-1.5 text-sm text-ink-soft sm:gap-2.5 ${className}`} {...props} />
}

export function BreadcrumbItem({ className = '', ...props }: ComponentProps<'li'>) {
  return <li data-slot="breadcrumb-item" className={`inline-flex items-center gap-1.5 ${className}`} {...props} />
}

export function BreadcrumbLink({ className = '', ...props }: ComponentProps<typeof Link>) {
  return <Link data-slot="breadcrumb-link" className={`transition-colors hover:text-pine ${className}`} {...props} />
}

export function BreadcrumbPage({ className = '', ...props }: ComponentProps<'span'>) {
  return <span data-slot="breadcrumb-page" aria-current="page" className={`font-medium text-ink ${className}`} {...props} />
}

export function BreadcrumbSeparator({ children, className = '', ...props }: ComponentProps<'li'> & { children?: ReactNode }) {
  return <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" className={className} {...props}>{children ?? <Icon name="chevron-right" className="h-3.5 w-3.5" />}</li>
}
