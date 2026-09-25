import type { HouseholdImportPreview } from '../../api/householdApi'

export type ImportPreviewModalProps = {
  preview: HouseholdImportPreview
  confirming: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => Promise<void>
}
