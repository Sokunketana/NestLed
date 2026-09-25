import type { BulkMoveItemsResponse, Room, StorageLocation } from '../../types'

export type BulkMoveItemsModalProps = {
  itemIds: number[]
  rooms: Room[]
  locations: StorageLocation[]
  onClose: () => void
  onMoved: (result: BulkMoveItemsResponse) => Promise<void> | void
}
