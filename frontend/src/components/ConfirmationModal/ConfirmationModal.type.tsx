export type ConfirmationModalProps = {
  title: string
  description: string
  confirmLabel?: string
  confirmingLabel?: string
  errorMessage?: string
  intent?: 'delete' | 'logout' | 'leave' | 'transfer'
  onClose: () => void
  onConfirm: () => Promise<void> | void
}
