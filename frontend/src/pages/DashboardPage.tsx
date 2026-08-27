import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../api/dashboardApi'
import { Loading, ErrorMessage } from '../components/PageState'
import type { Dashboard } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard>()
  const [error, setError] = useState('')
  useEffect(() => { dashboardApi.get().then(setData).catch(e => setError(e.message)) }, [])
  if (error) return <ErrorMessage message={error} />
  if (!data) return <Loading />
  const stats = [
    ['Total items', data.totalItems, 'All catalogued belongings'],
    ['Rooms', data.totalRooms, 'Spaces in your home'],
    ['Categories', data.totalCategories, 'Ways your items are grouped'],
    ['Estimated value', money.format(data.totalEstimatedValue), 'Quantity included'],
  ]
  return <>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">At a glance</p><h1 className="mt-2 text-4xl">Welcome home.</h1><p className="mt-2 text-stone-500">A calm, searchable place for everything you own.</p></div>
      <Link to="/items/new" className="btn-primary">＋ Add an item</Link>
    </div>
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label, value, note]) => <div className="card" key={label}><p className="text-sm font-semibold text-stone-500">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-stone-400">{note}</p></div>)}
    </section>
    <section className="mt-10">
      <div className="flex items-end justify-between"><div><p className="eyebrow">Your spaces</p><h2 className="mt-2 text-2xl">Rooms</h2></div><Link to="/rooms" className="text-sm font-semibold text-pine">Manage rooms →</Link></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.rooms.map((room, index) => <Link to={`/items?roomId=${room.id}`} className="card group overflow-hidden hover:-translate-y-0.5" key={room.id}>
          <div className={`mb-5 h-2 w-16 rounded-full ${['bg-coral','bg-amber-400','bg-emerald-500'][index % 3]}`} />
          <h3 className="text-xl group-hover:text-pine">{room.name}</h3><p className="mt-1 text-sm text-stone-500">{room.itemCount} {room.itemCount === 1 ? 'item' : 'items'}</p>
        </Link>)}
        {!data.rooms.length && <Link to="/rooms" className="card border-dashed text-center text-stone-500">＋ Add your first room</Link>}
      </div>
    </section>
  </>
}
