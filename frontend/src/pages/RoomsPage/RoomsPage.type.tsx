import type { Room, StorageLocation } from '../../types'

export type AddMode = 'room' | 'location'

export type DeleteTarget =
  | { type: 'room'; value: Room }
  | { type: 'location'; value: StorageLocation }
