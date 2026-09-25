import type { Category, Dashboard, Item, Room, StorageLocation } from '../../types'

export type InventoryOverviewProps = {
  dashboard: Dashboard
  rooms: Room[]
  locations: StorageLocation[]
  categories: Category[]
}

export type AddItemModalProps = {
  rooms: Room[]
  locations: StorageLocation[]
  categories: Category[]
  defaultRoomId?: number
  defaultLocationId?: number
  onClose: () => void
  onSaved: (item: Item) => void
}

export type RoomCardProps = {
  room: Room
  onClick: () => void
}

export type LocationCardProps = {
  location: StorageLocation
  onClick: () => void
}

export type CompactItemCardProps = {
  item: Item
}
