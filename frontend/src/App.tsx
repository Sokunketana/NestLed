import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import ItemsPage from './pages/ItemsPage'
import ItemDetailsPage from './pages/ItemDetailsPage'
import ItemFormPage from './pages/ItemFormPage'
import RoomsPage from './pages/RoomsPage'
import CategoriesPage from './pages/CategoriesPage'
import LoginPage from './pages/LoginPage'
import HouseholdPage from './pages/HouseholdPage'
import InvitationPage from './pages/InvitationPage'
import { useAuth } from './auth/AuthContext'

export default function App() {
  const { status, user } = useAuth()
  if (status === 'loading') {
    return <main className="grid min-h-screen place-items-center text-stone-600">Checking your session…</main>
  }
  if (status === 'anonymous') return <LoginPage />
  if (user && user.pendingInvitations.length > 0) return <InvitationPage />

  return <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/items" element={<ItemsPage />} />
      <Route path="/items/new" element={<ItemFormPage />} />
      <Route path="/items/:id" element={<ItemDetailsPage />} />
      <Route path="/items/:id/edit" element={<ItemFormPage />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/household" element={<HouseholdPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
}
