import type { HouseholdExportPreview } from '../../api/householdApi'

export type ExportPreviewModalProps = {
  preview: HouseholdExportPreview
  confirming: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => Promise<void>
}
