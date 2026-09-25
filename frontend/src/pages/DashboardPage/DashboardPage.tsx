import useSWR from 'swr'
import { dashboardApi } from '../../api/dashboardApi'
import { cacheKeys } from '../../api/cache'
import { ErrorMessage, Loading } from '../../components/PageState'
import InventoryOverview from '../../components/InventoryOverview'
import type { Category, Dashboard, Room, StorageLocation } from '../../types'
import { categoryApi } from '../../api/categoryApi'
import { roomApi } from '../../api/roomApi'
import { storageLocationApi } from '../../api/storageLocationApi'

export default function DashboardPage() {
  const { data: dashboard, error: dashboardError } = useSWR<Dashboard>(cacheKeys.dashboard, dashboardApi.get)
  const { data: rooms, error: roomsError } = useSWR<Room[]>(cacheKeys.rooms, roomApi.list)
  const { data: locations, error: locationsError } = useSWR<StorageLocation[]>(cacheKeys.locations, storageLocationApi.list)
  const { data: categories, error: categoriesError } = useSWR<Category[]>(cacheKeys.categories, categoryApi.list)
  const error = dashboardError || roomsError || locationsError || categoriesError

  if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Unable to load your home inventory.'} />
  if (!dashboard || !rooms || !locations || !categories) return <Loading />

  return <InventoryOverview dashboard={dashboard} rooms={rooms} locations={locations} categories={categories} />
}
