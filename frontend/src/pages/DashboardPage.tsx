import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { dashboardApi } from '../api/dashboardApi'
import { cacheKeys } from '../api/cache'
import { Loading, ErrorMessage } from '../components/PageState'
import Icon, { type IconName } from '../components/Icon'
import type { Dashboard } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function DashboardPage() {
  const { data, error } = useSWR<Dashboard>(cacheKeys.dashboard, dashboardApi.get)
  if (error) return <ErrorMessage message={error} />
  if (!data) return <Loading />

  const stats: Array<{ label: string; value: string | number; icon: IconName }> = [
    { label: 'Items', value: data.totalItems, icon: 'box' },
    { label: 'Rooms', value: data.totalRooms, icon: 'home' },
    { label: 'Estimated value', value: money.format(data.totalEstimatedValue), icon: 'sparkles' },
  ]

  return <>
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="eyebrow">Home inventory</p>
        <h1 className="page-title mt-2">Everything in its place.</h1>
        <p className="mt-2 max-w-2xl text-stone-500">Use the home tree to browse by location, or search when you already know what you need.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/items/new" className="btn-primary"><Icon name="plus" className="h-4 w-4" />Add item</Link>
        <Link to="/items" className="btn-secondary"><Icon name="box" className="h-4 w-4" />Browse items</Link>
      </div>
    </div>

    <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Inventory summary">
      {stats.map(({ label, value, icon }) => <div className="rounded-2xl border border-line bg-surface px-4 py-4" key={label}>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-pine"><Icon name={icon} className="h-4 w-4" /></span>
          <p className="text-sm font-semibold text-stone-500">{label}</p>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      </div>)}
    </section>

    <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">Browse by place</p><h2 className="mt-2 text-2xl">Your rooms</h2></div>
          <Link to="/rooms" className="text-sm font-bold text-pine hover:text-deep">Manage rooms <Icon name="arrow-right" className="inline h-4 w-4" /></Link>
        </div>
        <div className="mt-4 divide-y divide-line">
          {data.rooms.map(room => <Link to={`/items?roomId=${room.id}`} className="group flex items-center gap-3 py-4 first:pt-1 last:pb-1" key={room.id}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage text-pine"><Icon name="home" className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold group-hover:text-pine">{room.name}</span><span className="mt-0.5 block text-sm text-ink-soft">{room.itemCount} {room.itemCount === 1 ? 'item' : 'items'}</span></span>
            <Icon name="arrow-right" className="h-4 w-4 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-pine" />
          </Link>)}
          {!data.rooms.length && <Link to="/rooms" className="block rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-stone-500"><Icon name="plus" className="mx-auto h-5 w-5 text-pine" /><span className="mt-2 block">Add your first room</span></Link>}
        </div>
      </div>

      <aside className="rounded-[1.35rem] bg-sage/65 p-6">
        <p className="eyebrow">A simple way to stay organized</p>
        <h2 className="mt-2 text-2xl">Start with the place.</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">Choose a room and storage location first, then add the items that live there. The tree will keep that path easy to revisit.</p>
        <div className="mt-6 space-y-2 text-sm">
          <Link to="/items/new" className="flex items-center gap-2 font-bold text-pine hover:text-deep"><Icon name="plus" className="h-4 w-4" />Add an item</Link>
          <Link to="/rooms" className="flex items-center gap-2 font-bold text-pine hover:text-deep"><Icon name="map" className="h-4 w-4" />Set up a room</Link>
        </div>
      </aside>
    </section>
  </>
}
