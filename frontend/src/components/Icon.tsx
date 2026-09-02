import type { SVGProps } from 'react'

export type IconName =
  | 'home'
  | 'box'
  | 'history'
  | 'map'
  | 'tag'
  | 'users'
  | 'search'
  | 'plus'
  | 'arrow-right'
  | 'arrow-left'
  | 'edit'
  | 'trash'
  | 'x'
  | 'chevron-down'
  | 'chevron-right'
  | 'log-out'
  | 'camera'
  | 'sliders'
  | 'check'
  | 'sparkles'
  | 'grid'
  | 'calendar'

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
}

export default function Icon({ name, ...props }: IconProps) {
  const shared = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }

  switch (name) {
    case 'home': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m3.5 10.8 8.5-7 8.5 7" /><path d="M5.5 9.5v10.8h13V9.5M9.5 20.3v-6h5v6" /></svg>
    case 'box': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" /><path d="m4 7 8 4 8-4M12 11v10" /></svg>
    case 'history': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" /><path d="M3.5 4.5v4h4M12 7v5l3.5 2" /></svg>
    case 'map': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m3.5 6 6-2 5 2 6-2v14l-6 2-5-2-6 2V6Z" /><path d="M9.5 4v14M14.5 6v14" /></svg>
    case 'tag': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M20 13 13 20a2 2 0 0 1-2.8 0L4 13V4h9l7 7a1.4 1.4 0 0 1 0 2Z" /><path d="M8.5 8.5h.01" /></svg>
    case 'users': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM16 3.7a3.5 3.5 0 0 1 0 6.8M17 14.6h.5a4 4 0 0 1 4 4V20" /></svg>
    case 'search': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
    case 'plus': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M12 5v14M5 12h14" /></svg>
    case 'arrow-right': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M4 12h15M13 6l6 6-6 6" /></svg>
    case 'arrow-left': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M20 12H5M11 6l-6 6 6 6" /></svg>
    case 'edit': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m14 5 5 5M4 20l3.5-.7L19.8 7a2.1 2.1 0 0 0-3-3L4.5 16.3 4 20Z" /></svg>
    case 'trash': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M4.5 6.5h15M9 6.5V4h6v2.5M7 6.5l.8 13h8.4l.8-13M10 10v6M14 10v6" /></svg>
    case 'x': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m6 6 12 12M18 6 6 18" /></svg>
    case 'chevron-down': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m6 9 6 6 6-6" /></svg>
    case 'chevron-right': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m9 6 6 6-6 6" /></svg>
    case 'log-out': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M14 8V5.5A2.5 2.5 0 0 0 11.5 3h-6A2.5 2.5 0 0 0 3 5.5v13A2.5 2.5 0 0 0 5.5 21h6a2.5 2.5 0 0 0 2.5-2.5V16M18 8l3.5 4L18 16M21.5 12H9" /></svg>
    case 'camera': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M4 7.5h3l1.2-2h7.6l1.2 2h3A1.5 1.5 0 0 1 21.5 9v9.5A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 4 7.5Z" /><circle cx="12" cy="14" r="3.5" /></svg>
    case 'sliders': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="1.8" fill="currentColor" stroke="none" /><circle cx="16" cy="12" r="1.8" fill="currentColor" stroke="none" /><circle cx="10" cy="18" r="1.8" fill="currentColor" stroke="none" /></svg>
    case 'check': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
    case 'sparkles': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3ZM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></svg>
    case 'grid': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>
    case 'calendar': return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" /></svg>
  }
}
