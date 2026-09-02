import { FormEvent, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import HomeTree from './HomeTree'
import ConfirmationModal from './ConfirmationModal'
import { useAuth } from '../auth/AuthContext'

const links = [['/', 'Overview'], ['/items', 'Items'], ['/rooms', 'Rooms & Locations'], ['/categories', 'Categories'], ['/household', 'Household']]

export default function Layout() {
  const [search, setSearch] = useState('')
  const [switchingHousehold, setSwitchingHousehold] = useState(false)
  const [householdError, setHouseholdError] = useState<string | null>(null)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const navigate = useNavigate()
  const { user, logout, activateHousehold } = useAuth()
  function submit(event: FormEvent) {
    event.preventDefault()
    if (search.trim()) navigate(`/items?q=${encodeURIComponent(search.trim())}`)
  }
  async function switchHousehold(id: number) {
    if (!user || id === user.householdId) return
    setSwitchingHousehold(true)
    setHouseholdError(null)
    try {
      await activateHousehold(id)
      window.location.assign('/')
    } catch (cause) {
      setHouseholdError(cause instanceof Error ? cause.message : 'Could not switch households')
      setSwitchingHousehold(false)
    }
  }
  return <div className="min-h-screen lg:flex">
    <aside className="bg-pine px-5 py-5 text-white lg:fixed lg:inset-y-0 lg:w-80 lg:overflow-hidden lg:px-6 lg:py-7">
      <NavLink to="/" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-xl">⌂</span>
        <span><strong className="font-serif text-xl">Nestled</strong><small className="block text-xs text-emerald-100">{user?.householdName || 'Home inventory'}</small></span>
      </NavLink>
      <nav className="mt-6 flex gap-2 overflow-x-auto lg:mt-8 lg:block lg:space-y-1">
        {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}
          className={({isActive}) => `block whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-white text-pine' : 'text-emerald-50 hover:bg-white/10'}`}>
          {label}
        </NavLink>)}
      </nav>
      <div className="mt-5 border-t border-white/15 pt-5">
        <label className="block text-xs font-bold uppercase tracking-widest text-emerald-100" htmlFor="household-switcher">Current household</label>
        <select id="household-switcher" className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
          value={user?.householdId ?? ''} disabled={switchingHousehold}
          onChange={event => void switchHousehold(Number(event.target.value))}>
          {user?.households.map(household => <option className="text-stone-900" key={household.id} value={household.id}>
            {household.name} ({household.role === 'OWNER' ? 'Owner' : 'Member'})
          </option>)}
        </select>
        {householdError && <p role="alert" className="mt-2 text-xs text-red-200">{householdError}</p>}
      </div>
      <details className="group mt-4 lg:contents" open>
        <summary className="cursor-pointer list-none rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold lg:hidden">Browse your home <span className="float-right group-open:rotate-180">⌄</span></summary>
        <HomeTree />
      </details>
    </aside>
    <main className="min-w-0 flex-1 lg:ml-80">
      <header className="sticky top-0 z-10 border-b bg-cream/90 px-5 py-4 backdrop-blur lg:px-10">
        <div className="flex items-center gap-3">
          <form onSubmit={submit} className="flex min-w-0 flex-1 gap-3">
            <div className="relative flex-1"><span className="absolute left-4 top-2.5 text-stone-400">⌕</span>
              <input aria-label="Global item search" className="field pl-10" placeholder="Search for a passport, charger, winter coat…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary">Search</button>
          </form>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold">{user?.displayName || user?.email}</p>
              {user?.displayName && <p className="text-xs text-stone-500">{user.email}</p>}
            </div>
            <button type="button" className="btn-secondary" onClick={() => setShowLogoutConfirmation(true)}>Sign out</button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-10"><Outlet /></div>
      {showLogoutConfirmation && <ConfirmationModal
        title="Sign out?"
        description="You’ll need to sign in with Google again to access your home inventory."
        confirmLabel="Sign out"
        confirmingLabel="Signing out…"
        errorMessage="Unable to sign out. Please try again."
        intent="logout"
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={logout}
      />}
    </main>
  </div>
}
