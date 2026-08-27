export type ItemCondition = 'NEW' | 'GOOD' | 'FAIR' | 'DAMAGED'

export interface Room { id: number; name: string; description?: string; itemCount: number }
export interface Category { id: number; name: string; color?: string; itemCount: number }
export interface StorageLocation {
  id: number; name: string; description?: string; roomId: number; roomName: string; itemCount: number
}
export interface Item {
  id: number; name: string; description?: string; quantity: number
  categoryId: number; categoryName: string; categoryColor?: string
  roomId: number; roomName: string; storageLocationId?: number; storageLocationName?: string
  estimatedValue: number; purchaseDate?: string; warrantyExpirationDate?: string
  condition: ItemCondition; notes?: string; createdAt: string; updatedAt: string
}
export type ItemPayload = Omit<Item, 'id' | 'categoryName' | 'categoryColor' | 'roomName' |
  'storageLocationName' | 'createdAt' | 'updatedAt'>
export interface Dashboard {
  totalItems: number; totalRooms: number; totalCategories: number
  totalEstimatedValue: number; rooms: Room[]
}
export interface ApiError { message: string; fieldErrors?: Record<string, string> }
