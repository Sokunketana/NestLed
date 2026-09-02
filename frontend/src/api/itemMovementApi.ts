import type { ItemMovement } from '../types'
import { request } from './http'

export const itemMovementApi = {
  list: () => request<ItemMovement[]>('/item-movements'),
}
