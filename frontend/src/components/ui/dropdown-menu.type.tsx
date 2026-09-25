import type { ComponentPropsWithoutRef, KeyboardEvent, MutableRefObject, ReactNode } from 'react'

export type DropdownMenuContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: MutableRefObject<HTMLButtonElement | null>
  contentId: string
}

export type DropdownMenuProps = {
  children: ReactNode
}

export type DropdownMenuContentProps = ComponentPropsWithoutRef<'div'> & {
  onEscapeKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void
}

export type DropdownMenuItemProps = ComponentPropsWithoutRef<'button'> & {
  onSelect?: () => void
  variant?: 'default' | 'destructive'
}
