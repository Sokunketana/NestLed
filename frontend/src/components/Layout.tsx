import { FormEvent, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import HomeTree from './HomeTree'
import ConfirmationModal from './ConfirmationModal'
import Icon, { type IconName } from './Icon'
import { useAuth } from '../auth/AuthContext'

const links: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/', label: 'Overview', icon: 'home' },
  { to: '/items', label: 'Items', icon: 'box' },
  { to: '/movements', label: 'Movement history', icon: 'history' },
  { to: '/rooms', label: 'Rooms & locations', icon: 'map' },
  { to: '/categories', label: 'Categories', icon: 'tag' },
  { to: '/household', label: 'Household', icon: 'users' },
]

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

  const avatar = (user?.displayName || user?.email || 'N').slice(0, 1).toUpperCase()

  return <div className="min-h-screen lg:flex">
    <aside className="relative z-20 bg-deep px-4 py-4 text-white lg:fixed lg:inset-y-0 lg:w-[17rem] lg:px-5 lg:py-6">
      <div className="relative flex h-full min-h-full flex-col">
        <NavLink to="/" className="group flex items-center gap-3 rounded-2xl px-2 py-1">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-coral/20 text-sage ring-1 ring-white/10 transition group-hover:bg-coral/30"><Icon name="home" className="h-5 w-5" /></span>
          <span><strong className="font-serif text-[1.35rem] tracking-tight">Nestled</strong><small className="block text-xs text-emerald-100/75">{user?.householdName || 'Home inventory'}</small></span>
        </NavLink>

        <div className="mt-8">
          <p className="px-3 text-[0.64rem] font-bold uppercase tracking-[0.2em] text-emerald-200/70">Workspace</p>
          <nav className="mt-2 flex gap-1 overflow-x-auto lg:block lg:space-y-1">
            {links.map(({ to, label, icon }) => <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `group flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-white text-deep shadow-sm' : 'text-emerald-50/85 hover:bg-white/10 hover:text-white'}`}>
              <Icon name={icon} className="h-[1.05rem] w-[1.05rem] shrink-0 opacity-80" />
              <span>{label}</span>
            </NavLink>)}
          </nav>
        </div>

        <div className="mt-auto pt-8">
          <details className="group mt-4 lg:contents" open>
            <summary className="cursor-pointer list-none rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold lg:hidden">Browse your home <Icon name="chevron-down" className="float-right mt-0.5 h-4 w-4 transition group-open:rotate-180" /></summary>
            <HomeTree />
          </details>
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
              <label className="block px-1 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-emerald-200/75" htmlFor="household-switcher">Current household</label>
              <HouseholdSwitcher
                households={user?.households ?? []}
                selectedHouseholdId={user?.householdId ?? null}
                disabled={switchingHousehold}
                onSelect={id => void switchHousehold(id)}
              />
              {householdError && <p role="alert" className="mt-2 text-xs text-red-200">{householdError}</p>}
            </div>
          </div>
        </div>
      </div>
    </aside>

    <main className="min-w-0 flex-1 lg:ml-[17rem]">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-cream/90 px-4 py-3 backdrop-blur-md sm:px-5 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <form onSubmit={submit} className="flex min-w-0 flex-1 gap-3">
            <div className="relative flex-1"><Icon name="search" className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <input aria-label="Global item search" className="field h-11 pl-10" placeholder="Search your home…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary h-11 px-4"><Icon name="search" className="h-4 w-4 sm:hidden" /><span className="hidden sm:inline">Search</span></button>
          </form>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right xl:block">
              <p className="text-sm font-semibold">{user?.displayName || user?.email}</p>
              {user?.displayName && <p className="text-xs text-ink-soft">{user.email}</p>}
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-sage text-sm font-bold text-pine xl:hidden">{avatar}</span>
            <button type="button" className="btn-secondary h-10 px-3 sm:px-4" onClick={() => setShowLogoutConfirmation(true)}><Icon name="log-out" className="h-4 w-4 sm:hidden" /><span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-5 lg:px-10 lg:py-10"><Outlet /></div>
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

type HouseholdOption = {
  id: number
  name: string
  role: 'OWNER' | 'MEMBER'
}

function HouseholdSwitcher({
  households,
  selectedHouseholdId,
  disabled,
  onSelect,
}: {
  households: HouseholdOption[]
  selectedHouseholdId: number | null
  disabled: boolean
  onSelect: (id: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedHousehold = households.find(household => household.id === selectedHouseholdId)

  useEffect(() => {
    if (!open) return

    function closeWhenClickedOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function closeWhenEscapeIsPressed(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function closeWhenViewportMoves() {
      setOpen(false)
    }

    document.addEventListener('pointerdown', closeWhenClickedOutside)
    document.addEventListener('keydown', closeWhenEscapeIsPressed)
    window.addEventListener('resize', closeWhenViewportMoves)
    window.addEventListener('scroll', closeWhenViewportMoves, true)

    return () => {
      document.removeEventListener('pointerdown', closeWhenClickedOutside)
      document.removeEventListener('keydown', closeWhenEscapeIsPressed)
      window.removeEventListener('resize', closeWhenViewportMoves)
      window.removeEventListener('scroll', closeWhenViewportMoves, true)
    }
  }, [open])

  function toggleMenu() {
    if (disabled || households.length === 0) return

    if (!open) {
      const trigger = containerRef.current?.querySelector('button')
      if (trigger) {
        const bounds = trigger.getBoundingClientRect()
        const availableAbove = bounds.top - 12
        const availableBelow = window.innerHeight - bounds.bottom - 12
        setOpenUpward(availableAbove > availableBelow)
      }
    }

    setOpen(current => !current)
  }

  function chooseHousehold(id: number) {
    setOpen(false)
    onSelect(id)
  }

  return <div className="relative mt-2" ref={containerRef}>
    <button
      id="household-switcher"
      type="button"
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-left text-sm text-white outline-none transition hover:bg-white/[0.14] focus:border-emerald-200/60 focus:ring-2 focus:ring-emerald-200/20 disabled:cursor-wait disabled:opacity-60"
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={disabled || households.length === 0}
      onClick={toggleMenu}
    >
      <span className="truncate">
        {selectedHousehold ? `${selectedHousehold.name} (${selectedHousehold.role === 'OWNER' ? 'Owner' : 'Member'})` : 'No household selected'}
      </span>
      <Icon name="chevron-down" className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
    </button>

    {open && <div
      id="household-switcher-menu"
      className={`absolute inset-x-0 z-50 max-h-60 overflow-y-auto rounded-xl border border-white/15 bg-white p-1.5 text-stone-900 shadow-xl ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'}`}
      role="listbox"
      aria-label="Households"
    >
      {households.map(household => {
        const isSelected = household.id === selectedHouseholdId
        return <button
          key={household.id}
          type="button"
          role="option"
          aria-selected={isSelected}
          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${isSelected ? 'bg-sage/70 font-semibold text-pine' : 'hover:bg-stone-100'}`}
          onClick={() => chooseHousehold(household.id)}
        >
          <span className="truncate">{household.name}</span>
          <span className="shrink-0 text-xs text-stone-500">{household.role === 'OWNER' ? 'Owner' : 'Member'}</span>
        </button>
      })}
    </div>}
  </div>
}
