export type ConfirmationModalProps = {
  title: string
  description: string
  confirmLabel?: string
  confirmingLabel?: string
  errorMessage?: string
  intent?: 'delete' | 'logout' | 'leave'
  onClose: () => void
  onConfirm: () => Promise<void> | void
}
