import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { dashboardApi } from '../api/dashboardApi'
import { cacheKeys } from '../api/cache'
import { Loading, ErrorMessage } from '../components/PageState'
import Icon, { type IconName } from '../components/Icon'
import type { Dashboard, DashboardActivity } from '../types'
import { defaultRoomColor, getSpaceColor, withColorAlpha } from '../spaceColors'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const activityDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const quickActions: Array<{ to: string; label: string; description: string; icon: IconName; iconClass: string }> = [
  { to: '/items/new', label: 'Add an item', description: 'Record something new in your home.', icon: 'plus', iconClass: 'bg-coral/10 text-[#a64d39]' },
  { to: '/items', label: 'Browse items', description: 'Search and explore your inventory.', icon: 'box', iconClass: 'bg-mint text-pine' },
  { to: '/rooms#quick-add', label: 'Add a room', description: 'Create another room.', icon: 'home', iconClass: 'bg-sage text-pine' },
  { to: '/categories#category-form', label: 'Add a category', description: 'Create a label for easier filtering.', icon: 'tag', iconClass: 'bg-gold/15 text-amber-700' },
]

function activityDescription(activity: DashboardActivity) {
  if (activity.type === 'ITEM_MOVED') {
    return `Moved from ${activity.fromRoomName} / ${activity.fromLocationName} to ${activity.toRoomName} / ${activity.toLocationName}`
  }
  return `Added to ${activity.roomName} / ${activity.locationName}`
}

export default function DashboardPage() {
  const { data, error } = useSWR<Dashboard>(cacheKeys.dashboard, dashboardApi.get)
  if (error) return <ErrorMessage message={error} />
  if (!data) return <Loading />
  const stats: Array<{ label: string; value: string | number; note: string }> = [
    { label: 'Total items', value: data.totalItems, note: 'All catalogued belongings' },
    { label: 'Rooms', value: data.totalRooms, note: 'Spaces in your home' },
    { label: 'Categories', value: data.totalCategories, note: 'Ways your items are grouped' },
    { label: 'Estimated value', value: money.format(data.totalEstimatedValue), note: 'Across recorded items' },
  ]
  const recentActivity = data.recentActivity ?? []

  return <>
    <section aria-label="Inventory stats" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, note }) => <div className="card relative overflow-hidden" key={label}>
        <p className="text-sm font-semibold text-stone-500">{label}</p>
        <p className="mt-5 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-ink-soft">{note}</p>
      </div>)}
    </section>

    <section className="mt-8" aria-labelledby="quick-actions-title">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Make progress</p><h2 id="quick-actions-title" className="mt-2 text-2xl">Quick actions</h2></div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map(action => <Link to={action.to} className="card group flex items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:border-pine/30 hover:shadow-soft" key={action.label}>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${action.iconClass}`}><Icon name={action.icon} className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold group-hover:text-pine">{action.label}</span><span className="mt-1 block text-sm leading-relaxed text-ink-soft">{action.description}</span></span>
          <Icon name="arrow-right" className="ml-auto h-4 w-4 shrink-0 self-center text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-pine" />
        </Link>)}
      </div>
    </section>

    <section className="mt-10" aria-labelledby="recent-activity-title">
      <div><p className="eyebrow">What’s changed</p><div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2"><h2 id="recent-activity-title" className="text-2xl">Recent activity</h2><Link to="/movements" aria-label="View movement history" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-pine hover:text-deep">View history <Icon name="arrow-right" className="h-4 w-4" /></Link></div></div>
      {recentActivity.length ? <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {recentActivity.map(activity => <Link to={`/items/${activity.itemId}`} className="card group flex min-w-0 items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:border-pine/30 hover:shadow-soft" key={`${activity.type}-${activity.itemId}-${activity.occurredAt}`}>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${activity.type === 'ITEM_MOVED' ? 'bg-sage text-pine' : 'bg-coral/10 text-[#a64d39]'}`}><Icon name={activity.type === 'ITEM_MOVED' ? 'arrow-right' : 'plus'} className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate font-bold group-hover:text-pine">{activity.itemName}</span><span className="mt-1 block text-sm leading-relaxed text-ink-soft">{activityDescription(activity)}</span></span>
          <time className="shrink-0 text-right text-xs font-semibold text-stone-400" dateTime={activity.occurredAt}>{activityDate.format(new Date(activity.occurredAt))}</time>
        </Link>)}
      </div> : <div className="card mt-5 border-dashed text-center"><Icon name="history" className="mx-auto h-6 w-6 text-pine" /><p className="mt-3 font-semibold">No activity yet.</p><p className="mt-1 text-sm text-ink-soft">Add your first item or move something to see updates here.</p></div>}
    </section>

    <section className="mt-10">
      <div><p className="eyebrow">Your spaces</p><div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2"><h2 className="text-2xl">Rooms at a glance</h2><Link to="/rooms" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-pine">Manage rooms <Icon name="arrow-right" className="h-4 w-4" /></Link></div></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.rooms.map(room => { const color = getSpaceColor(room.color, defaultRoomColor); return <Link to={`/items?roomId=${room.id}`} className="card group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-soft" key={room.id}>
          <div className="flex h-24 items-start justify-end p-5" style={{ backgroundColor: withColorAlpha(color, '26') }}>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-stone-600">{room.itemCount} {room.itemCount === 1 ? 'item' : 'items'}</span>
          </div>
          <div className="flex items-center justify-between gap-3 p-5"><div><h3 className="text-xl group-hover:text-pine">{room.name}</h3><p className="mt-1 text-sm text-ink-soft">Browse this room</p></div><Icon name="arrow-right" className="h-5 w-5 text-stone-400 transition group-hover:translate-x-1 group-hover:text-pine" /></div>
        </Link> })}
        {!data.rooms.length && <Link to="/rooms" className="card border-dashed text-center text-stone-500"><Icon name="plus" className="mx-auto h-5 w-5 text-pine" /><span className="mt-2 block">Add your first room</span></Link>}
      </div>
    </section>
  </>
}
