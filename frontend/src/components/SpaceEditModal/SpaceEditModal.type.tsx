import type { Room, StorageLocation } from '../../types'

export type SpaceEditTarget =
  | { type: 'room'; value: Room }
  | { type: 'location'; value: StorageLocation }

export type SpaceEditForm = {
  name: string
  description: string
  color: string
  roomId?: number
}

export type SpaceEditModalProps = {
  target: SpaceEditTarget
  rooms: Room[]
  onClose: () => void
  onSave: (form: SpaceEditForm) => Promise<void> | void
}
