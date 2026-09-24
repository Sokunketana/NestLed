import { FormEvent, useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import ConfirmationModal from './ConfirmationModal'
import Icon from './Icon'
import { useAuth } from '../auth/AuthContext'
import OnboardingWelcome from './OnboardingWelcome'
import SetupGuide, { type SetupData } from './SetupGuide'
import TutorialRequiredModal from './TutorialRequiredModal'

export default function Layout({ onboarding }: { onboarding?: SetupData }) {
  const [search, setSearch] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [showTutorialRequired, setShowTutorialRequired] = useState(false)
  const [avatarImageFailed, setAvatarImageFailed] = useState(false)
  const [onboardingStarted, setOnboardingStarted] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, completeOnboarding } = useAuth()
  const setupComplete = Boolean(onboarding?.rooms.length && onboarding.locations.length && onboarding.categories.length)
  const onboardingActive = Boolean(onboarding && user?.onboardingCompleted === false && !setupComplete)
  const showOnboardingWelcome = onboardingActive && !onboardingStarted
  const onboardingStep = !onboarding?.rooms.length ? 'room' : !onboarding.locations.length ? 'location' : 'category'
  const wasOnboardingActive = useRef(onboardingActive)
  const completionRequested = useRef(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!search.trim()) return
    if (onboardingActive && onboardingStarted) {
      setShowTutorialRequired(true)
      return
    }
    navigate(`/items?q=${encodeURIComponent(search.trim())}`)
  }

  function handleNavigationAttempt(event: MouseEvent<HTMLDivElement>) {
    if (!onboardingActive || !onboardingStarted || event.defaultPrevented
      || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const link = (event.target as HTMLElement).closest('a')
    const href = link?.getAttribute('href')
    if (!href || href.startsWith('#')) return

    const destination = new URL(href, window.location.href)
    if (destination.origin !== window.location.origin) return

    const setupTarget = onboardingStep === 'category'
      ? { pathname: '/categories', search: '' }
      : { pathname: '/rooms', search: `?setup=${onboardingStep}` }
    if (destination.pathname === setupTarget.pathname && destination.search === setupTarget.search) return

    event.preventDefault()
    event.stopPropagation()
    setShowTutorialRequired(true)
  }

  const avatar = (user?.displayName || user?.email || 'N').slice(0, 1).toUpperCase()
  const accountName = user?.displayName || 'Your account'

  useEffect(() => {
    setAvatarImageFailed(false)
  }, [user?.pictureUrl])

  useEffect(() => {
    if (setupComplete && user?.onboardingCompleted === false && !completionRequested.current) {
      completionRequested.current = true
      void completeOnboarding().catch(() => { completionRequested.current = false })
    }
    if (wasOnboardingActive.current && !onboardingActive) {
      navigate('/items/new', { replace: true })
    }
    wasOnboardingActive.current = onboardingActive
  }, [completeOnboarding, navigate, onboardingActive, setupComplete, user?.onboardingCompleted])

  useEffect(() => {
    if (!onboardingActive || !onboardingStarted) return
    const setupMode = new URLSearchParams(location.search).get('setup')
    const target = onboardingStep === 'category' ? '/categories#category-form' : `/rooms?setup=${onboardingStep}#quick-add`
    const alreadyAtTarget = onboardingStep === 'category'
      ? location.pathname === '/categories'
      : location.pathname === '/rooms' && setupMode === onboardingStep
    if (!alreadyAtTarget) navigate(target, { replace: true })
  }, [location.pathname, location.search, navigate, onboardingActive, onboardingStarted, onboardingStep])

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

  return <div className="min-h-screen" onClickCapture={handleNavigationAttempt}>
    <main className="min-w-0 overflow-x-clip">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-cream/90 backdrop-blur-md">
        <div className="relative flex w-full flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-5 lg:px-8 min-[1600px]:justify-between">
          <Link to="/" className="group order-1 flex shrink-0 items-center gap-2 rounded-xl py-1 sm:order-none">
            <span><strong className="font-serif text-[1.35rem] tracking-tight text-deep">Nestled</strong><small className="block max-w-28 truncate text-[0.68rem] text-ink-soft">{user?.householdName || 'Home inventory'}</small></span>
          </Link>
          <form onSubmit={submit} className="order-3 flex min-w-0 basis-full gap-2 sm:order-none sm:mx-auto sm:max-w-7xl sm:flex-1 sm:basis-auto sm:gap-3 min-[1600px]:absolute min-[1600px]:inset-x-0 min-[1600px]:top-1/2 min-[1600px]:w-full min-[1600px]:-translate-y-1/2 min-[1600px]:px-10">
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
                {user?.email && <p className="mt-0.5 break-all text-xs text-ink-soft">{user.email}</p>}
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
        {showOnboardingWelcome && <OnboardingWelcome onStart={() => setOnboardingStarted(true)} />}
        {onboardingActive && onboardingStarted && onboarding && <SetupGuide data={onboarding} />}
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
      {showTutorialRequired && <TutorialRequiredModal
        stepLabel={onboardingStep === 'room' ? 'create a room' : onboardingStep === 'location' ? 'add a location' : 'create a category'}
        onContinue={() => {
          setShowTutorialRequired(false)
          const target = onboardingStep === 'category' ? '/categories#category-form' : `/rooms?setup=${onboardingStep}#quick-add`
          navigate(target)
        }}
      />}
    </main>
  </div>
}
