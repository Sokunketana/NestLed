import type { Item } from '../../types'

export type DuplicateItemModalProps = {
  items: Item[]
  onClose: () => void
  onConfirm: () => Promise<void>
}
