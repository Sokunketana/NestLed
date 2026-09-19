import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { dashboardApi } from '../api/dashboardApi'
import { cacheKeys } from '../api/cache'
import { Loading, ErrorMessage } from '../components/PageState'
import Icon, { type IconName } from '../components/Icon'
import type { Dashboard } from '../types'
import { defaultRoomColor, getSpaceColor, withColorAlpha } from '../spaceColors'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function DashboardPage() {
  const { data, error } = useSWR<Dashboard>(cacheKeys.dashboard, dashboardApi.get)
  if (error) return <ErrorMessage message={error} />
  if (!data) return <Loading />
  const stats: Array<{ label: string; value: string | number; note: string; icon: IconName }> = [
    { label: 'Total items', value: data.totalItems, note: 'All catalogued belongings', icon: 'box' },
    { label: 'Rooms', value: data.totalRooms, note: 'Spaces in your home', icon: 'home' },
    { label: 'Categories', value: data.totalCategories, note: 'Ways your items are grouped', icon: 'tag' },
    { label: 'Estimated value', value: money.format(data.totalEstimatedValue), note: 'Across recorded items', icon: 'sparkles' },
  ]
  return <>
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, note, icon }) => <div className="card relative overflow-hidden" key={label}>
        <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-stone-500">{label}</p><span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-pine"><Icon name={icon} className="h-4 w-4" /></span></div>
        <p className="mt-5 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-ink-soft">{note}</p>
      </div>)}
    </section>
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Your spaces</p><h2 className="mt-2 text-2xl">Rooms at a glance</h2></div><Link to="/rooms" className="inline-flex items-center gap-2 text-sm font-bold text-pine">Manage rooms <Icon name="arrow-right" className="h-4 w-4" /></Link></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.rooms.map(room => { const color = getSpaceColor(room.color, defaultRoomColor); return <Link to={`/items?roomId=${room.id}`} className="card group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-soft" key={room.id}>
          <div className="flex h-24 items-start justify-between p-5" style={{ backgroundColor: withColorAlpha(color, '26') }}>
            <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: withColorAlpha(color, '18'), color }}><Icon name="home" className="h-5 w-5" /></span>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-stone-600">{room.itemCount} {room.itemCount === 1 ? 'item' : 'items'}</span>
          </div>
          <div className="flex items-center justify-between gap-3 p-5"><div><h3 className="text-xl group-hover:text-pine">{room.name}</h3><p className="mt-1 text-sm text-ink-soft">Browse this room</p></div><Icon name="arrow-right" className="h-5 w-5 text-stone-400 transition group-hover:translate-x-1 group-hover:text-pine" /></div>
        </Link> })}
        {!data.rooms.length && <Link to="/rooms" className="card border-dashed text-center text-stone-500"><Icon name="plus" className="mx-auto h-5 w-5 text-pine" /><span className="mt-2 block">Add your first room</span></Link>}
      </div>
    </section>
  </>
}
