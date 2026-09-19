import { Navigate, Route, Routes } from 'react-router-dom'
import useSWR from 'swr'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import HomeTreePage from './pages/HomeTreePage'
import ItemsPage from './pages/ItemsPage'
import ItemDetailsPage from './pages/ItemDetailsPage'
import ItemFormPage from './pages/ItemFormPage'
import RoomsPage from './pages/RoomsPage'
import CategoriesPage from './pages/CategoriesPage'
import LoginPage from './pages/LoginPage'
import MovementHistoryPage from './pages/MovementHistoryPage'
import { useAuth } from './auth/AuthContext'
import LoadingScreen from './components/LoadingScreen'
import SettingsLayout from './components/SettingsLayout'
import ProfilePage from './pages/ProfilePage'
import HouseholdSettingsPage from './pages/HouseholdSettingsPage'
import HouseholdDataPage from './pages/HouseholdDataPage'
import { cacheKeys } from './api/cache'
import { roomApi } from './api/roomApi'
import { storageLocationApi } from './api/storageLocationApi'
import { categoryApi } from './api/categoryApi'
import { ErrorMessage } from './components/PageState'
import type { Category, Room, StorageLocation } from './types'

export default function App() {
  const { status } = useAuth()
  const authenticated = status === 'authenticated'
  const { data: rooms, error: roomsError } = useSWR<Room[]>(authenticated ? cacheKeys.rooms : null, roomApi.list)
  const { data: locations, error: locationsError } = useSWR<StorageLocation[]>(authenticated ? cacheKeys.locations : null, storageLocationApi.list)
  const { data: categories, error: categoriesError } = useSWR<Category[]>(authenticated ? cacheKeys.categories : null, categoryApi.list)

  if (status === 'loading') {
    return <LoadingScreen />
  }
  if (status === 'anonymous') return <LoginPage />

  const setupError = roomsError || locationsError || categoriesError
  if (setupError) {
    return <main className="grid min-h-screen place-items-center bg-cream px-4 py-8"><div className="w-full max-w-lg"><ErrorMessage message={setupError instanceof Error ? setupError.message : 'Unable to load your home setup.'} /><button type="button" className="btn-primary mt-4" onClick={() => window.location.reload()}>Try again</button></div></main>
  }
  if (!rooms || !locations || !categories) {
    return <LoadingScreen />
  }

  return <Routes>
    <Route element={<Layout onboarding={{ rooms, locations, categories }} />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/home" element={<HomeTreePage />} />
      <Route path="/items" element={<ItemsPage />} />
      <Route path="/items/new" element={<ItemFormPage />} />
      <Route path="/items/:id" element={<ItemDetailsPage />} />
      <Route path="/items/:id/edit" element={<ItemFormPage />} />
      <Route path="/movements" element={<MovementHistoryPage />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/household" element={<Navigate to="/profile/household" replace />} />
      <Route path="/profile" element={<SettingsLayout />}>
        <Route index element={<ProfilePage />} />
        <Route path="household" element={<HouseholdSettingsPage />} />
        <Route path="data" element={<HouseholdDataPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
}
