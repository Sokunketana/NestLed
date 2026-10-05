import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import HomeTreePage from './pages/HomeTreePage'
import ItemsPage from './pages/ItemsPage'
import ItemDetailsPage from './pages/ItemDetailsPage'
import ItemFormPage from './pages/ItemFormPage'
import RoomsPage from './pages/RoomsPage'
import CategoriesPage from './pages/CategoriesPage'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import MovementHistoryPage from './pages/MovementHistoryPage'
import { useAuth } from './auth/AuthContext'
import LoadingScreen from './components/LoadingScreen'
import SettingsLayout from './components/SettingsLayout'
import ProfilePage from './pages/ProfilePage'
import HouseholdSettingsPage from './pages/HouseholdSettingsPage'
import HouseholdDataPage from './pages/HouseholdDataPage'

export default function App() {
  const { status } = useAuth()
  const { search } = useLocation()

  // Public pages render while the session check runs in the background.
  if (status !== 'authenticated') return <Routes>
    <Route path="/" element={new URLSearchParams(search).has('loginError') ? <Navigate to={`/login${search}`} replace /> : <LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="*" element={status === 'loading' ? <LoadingScreen /> : <Navigate to="/" replace />} />
  </Routes>

  return <Routes>
    <Route path="/login" element={<Navigate to="/" replace />} />
    <Route element={<Layout />}>
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
