import { NavLink, Outlet } from 'react-router-dom'

const settingsLinks = [
  { to: '/profile', label: 'Account', end: true },
  { to: '/profile/household', label: 'Household', end: false },
  { to: '/profile/data', label: 'Data', end: false },
]

export default function SettingsLayout() {
  return <div className="space-y-7">
    <div>
      <h1 className="page-title">Profile & settings</h1>
      <p className="mt-2 text-stone-500">Manage your account, household, and inventory data.</p>
    </div>

    <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto rounded-2xl bg-cream p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {settingsLinks.map(link => <NavLink
        key={link.to}
        to={link.to}
        end={link.end}
        className={({ isActive }) => `whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-white text-deep shadow-sm' : 'text-ink-soft hover:text-ink'}`}
      >{link.label}</NavLink>)}
    </nav>

    <Outlet />
  </div>
}
