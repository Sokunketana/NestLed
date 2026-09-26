import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import ConfirmationModal from '../ConfirmationModal'
import Icon from '../Icon'
import { useAuth } from '../../auth/AuthContext'
import BrandLogo from '../BrandLogo'

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
    if (!search.trim()) return
    navigate(`/items?q=${encodeURIComponent(search.trim())}`)
  }

  const avatar = (user?.displayName || user?.email || 'N').slice(0, 1).toUpperCase()
  const accountName = user?.displayName || 'Your account'

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

  return <div className="min-h-screen">
    <main className="min-w-0 overflow-x-clip">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-cream/90 backdrop-blur-md">
        <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-5 lg:px-8 min-[1600px]:grid min-[1600px]:grid-cols-[auto_minmax(0,1fr)_auto]">
          <Link to="/" className="group order-1 flex shrink-0 items-center gap-2 rounded-xl py-1 sm:order-none">
            <BrandLogo />
          </Link>
          <form onSubmit={submit} className="order-3 flex min-w-0 basis-full gap-2 sm:order-none sm:mx-0 sm:w-0 sm:max-w-none sm:flex-1 sm:basis-auto sm:gap-3 min-[1600px]:static min-[1600px]:w-auto min-[1600px]:max-w-none min-[1600px]:translate-x-0 min-[1600px]:translate-y-0 min-[1600px]:px-0">
            <div className="relative min-w-0 flex-1"><Icon name="search" className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <input aria-label="Global item search" className="field h-11 pl-10" placeholder="Find an item…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary h-11 shrink-0 px-3 sm:px-4"><Icon name="search" className="h-4 w-4 sm:hidden" /><span className="hidden sm:inline">Search</span></button>
          </form>
          <div ref={profileMenuRef} className="relative order-2 ml-auto shrink-0 sm:order-none">
            <button
              type="button"
              className="group grid h-11 w-11 place-items-center rounded-full border border-line bg-surface p-1.5 transition hover:border-stone-300 hover:bg-white"
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
            </button>

            {showProfileMenu && <div role="menu" aria-label="Account menu" className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(16rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-surface p-2 shadow-card">
              <div className="border-b border-line px-3 py-2.5">
                <p className="break-words text-sm font-semibold text-ink">{accountName}</p>
                {user?.householdName && <p className="mt-0.5 break-words text-xs text-ink-soft">{user.householdName}</p>}
              </div>
              <Link
                to="/profile"
                role="menuitem"
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-cream"
                onClick={() => setShowProfileMenu(false)}
              >
                <Icon name="sliders" className="h-4 w-4 text-ink-soft" />
                Settings
              </Link>
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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8 lg:px-10 lg:py-10">
        <Outlet />
      </div>
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
