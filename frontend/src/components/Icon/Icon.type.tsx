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
  | 'more-horizontal'
  | 'log-out'
  | 'camera'
  | 'sliders'
  | 'check'
  | 'sparkles'
  | 'grid'
  | 'calendar'
  | 'download'
  | 'upload'

export type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
}
