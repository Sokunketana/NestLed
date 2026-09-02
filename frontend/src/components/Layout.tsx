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
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [avatarImageFailed, setAvatarImageFailed] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function submit(event: FormEvent) {
    event.preventDefault()
    if (search.trim()) navigate(`/items?q=${encodeURIComponent(search.trim())}`)
  }

  const avatar = (user?.displayName || user?.email || 'N').slice(0, 1).toUpperCase()
  const accountName = user?.displayName || user?.email || 'Your account'

  useEffect(() => {
    setAvatarImageFailed(false)
  }, [user?.pictureUrl])

  useEffect(() => {
    function closeProfileMenu(event: PointerEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    function closeProfileMenuWithEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowProfileMenu(false)
    }

    document.addEventListener('pointerdown', closeProfileMenu)
    document.addEventListener('keydown', closeProfileMenuWithEscape)
    return () => {
      document.removeEventListener('pointerdown', closeProfileMenu)
      document.removeEventListener('keydown', closeProfileMenuWithEscape)
    }
  }, [])

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
              <p className="px-1 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-emerald-200/75">Your household</p>
              <p className="mt-2 truncate px-1 text-sm font-semibold text-white">{user?.householdName || 'No household'}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <main className="min-w-0 flex-1 lg:ml-[17rem]">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-cream/90 px-4 py-3 backdrop-blur-md sm:px-5 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center gap-4 sm:gap-5 lg:gap-8">
          <form onSubmit={submit} className="flex min-w-0 flex-1 gap-3 lg:ml-10 lg:max-w-4xl">
            <div className="relative flex-1"><Icon name="search" className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <input aria-label="Global item search" className="field h-11 pl-10" placeholder="Search your home…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary h-11 px-4"><Icon name="search" className="h-4 w-4 sm:hidden" /><span className="hidden sm:inline">Search</span></button>
          </form>
          <div ref={profileMenuRef} className="relative ml-auto shrink-0 lg:translate-x-24">
            <button
              type="button"
              className="group flex h-11 items-center gap-2 rounded-full border border-line bg-surface p-1.5 pr-2.5 transition hover:border-stone-300 hover:bg-white"
              aria-label={`Open account menu for ${accountName}`}
              aria-expanded={showProfileMenu}
              aria-haspopup="menu"
              onClick={() => setShowProfileMenu(isOpen => !isOpen)}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-sage text-sm font-bold text-pine ring-1 ring-pine/10">
                {user?.pictureUrl && !avatarImageFailed
                  ? <img src={user.pictureUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setAvatarImageFailed(true)} />
                  : avatar}
              </span>
              <span className="hidden max-w-44 text-left xl:block">
                <span className="block truncate text-sm font-semibold text-ink">{accountName}</span>
                {user?.displayName && <span className="block truncate text-xs text-ink-soft">{user.email}</span>}
              </span>
              <Icon name="chevron-down" className={`h-4 w-4 text-ink-soft transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && <div role="menu" aria-label="Account menu" className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-64 rounded-2xl border border-line bg-surface p-2 shadow-card">
              <div className="border-b border-line px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-ink">{accountName}</p>
                {user?.displayName && <p className="mt-0.5 truncate text-xs text-ink-soft">{user.email}</p>}
              </div>
              <button
                type="button"
                role="menuitem"
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-cream"
                onClick={() => {
                  setShowProfileMenu(false)
                  setShowLogoutConfirmation(true)
                }}
              >
                <Icon name="log-out" className="h-4 w-4 text-ink-soft" />
                Sign out
              </button>
            </div>}
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
