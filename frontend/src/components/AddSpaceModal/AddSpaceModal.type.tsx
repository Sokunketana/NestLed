import type { Room, StorageLocation } from '../../types'

export type AddSpaceModalProps = {
  mode: 'room' | 'location'
  room?: Room
  onClose: () => void
  onSaved: (space: Room | StorageLocation) => void
}
