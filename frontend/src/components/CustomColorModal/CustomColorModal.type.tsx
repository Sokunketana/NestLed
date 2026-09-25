import type { RefObject } from 'react'

export type CustomColorModalProps = {
  anchorRef: RefObject<HTMLElement | null>
  value: string
  onChange: (color: string) => void
  onClose: () => void
}

export type HsvColor = { h: number; s: number; v: number }
export type PanelDrag = { pointerId: number; offsetX: number; offsetY: number }
