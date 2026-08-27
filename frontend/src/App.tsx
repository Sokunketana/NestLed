import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import ItemsPage from './pages/ItemsPage'
import ItemDetailsPage from './pages/ItemDetailsPage'
import ItemFormPage from './pages/ItemFormPage'
import RoomsPage from './pages/RoomsPage'
import CategoriesPage from './pages/CategoriesPage'

export default function App() {
  return <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/items" element={<ItemsPage />} />
      <Route path="/items/new" element={<ItemFormPage />} />
      <Route path="/items/:id" element={<ItemDetailsPage />} />
      <Route path="/items/:id/edit" element={<ItemFormPage />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
}
