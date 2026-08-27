import { FormEvent, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const links = [['/', 'Overview'], ['/items', 'Items'], ['/rooms', 'Rooms & Locations'], ['/categories', 'Categories']]

export default function Layout() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  function submit(event: FormEvent) {
    event.preventDefault()
    if (search.trim()) navigate(`/items?q=${encodeURIComponent(search.trim())}`)
  }
  return <div className="min-h-screen lg:flex">
    <aside className="bg-pine px-5 py-5 text-white lg:fixed lg:inset-y-0 lg:w-64 lg:px-7 lg:py-8">
      <NavLink to="/" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-xl">⌂</span>
        <span><strong className="font-serif text-xl">Nestled</strong><small className="block text-xs text-emerald-100">Home inventory</small></span>
      </NavLink>
      <nav className="mt-6 flex gap-2 overflow-x-auto lg:mt-12 lg:block lg:space-y-2">
        {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}
          className={({isActive}) => `block whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-white text-pine' : 'text-emerald-50 hover:bg-white/10'}`}>
          {label}
        </NavLink>)}
      </nav>
    </aside>
    <main className="min-w-0 flex-1 lg:ml-64">
      <header className="sticky top-0 z-10 border-b bg-cream/90 px-5 py-4 backdrop-blur lg:px-10">
        <form onSubmit={submit} className="mx-auto flex max-w-6xl gap-3">
          <div className="relative flex-1"><span className="absolute left-4 top-2.5 text-stone-400">⌕</span>
            <input aria-label="Global item search" className="field pl-10" placeholder="Search for a passport, charger, winter coat…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary">Search</button>
        </form>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-10"><Outlet /></div>
    </main>
  </div>
}
