import type {
  ComponentPropsWithoutRef,
  MutableRefObject,
  ReactNode,
} from 'react'

export type SelectContextValue = {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  disabled: boolean
  required: boolean
  triggerRef: MutableRefObject<HTMLButtonElement | null>
  rootRef: MutableRefObject<HTMLDivElement | null>
  contentId: string
  labels: Record<string, string>
  registerLabel: (value: string, label: string) => void
  unregisterLabel: (value: string) => void
}

export type SelectProps = {
  children: ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  required?: boolean
  name?: string
}

export type SelectTriggerProps = ComponentPropsWithoutRef<'button'>

export type SelectValueProps = {
  placeholder?: ReactNode
  className?: string
}

export type SelectContentProps = ComponentPropsWithoutRef<'div'>

export type SelectItemProps = Omit<ComponentPropsWithoutRef<'button'>, 'value'> & {
  value: string
}
