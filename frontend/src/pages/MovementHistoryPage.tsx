import { useEffect, useMemo, useState } from 'react'
import { itemMovementApi } from '../api/itemMovementApi'
import { Empty, ErrorMessage, Loading } from '../components/PageState'
import Icon from '../components/Icon'
import type { ItemMovement } from '../types'

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function locationLabel(roomName: string, locationName: string) {
  return `${roomName} → ${locationName}`
}

function localDateKey(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function MovementHistoryPage() {
  const [movements, setMovements] = useState<ItemMovement[]>()
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    itemMovementApi.list()
      .then(nextMovements => { if (!ignore) setMovements(nextMovements) })
      .catch(cause => {
        if (!ignore) setError(cause instanceof Error ? cause.message : 'Unable to load movement history.')
      })
    return () => { ignore = true }
  }, [])

  const visibleMovements = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return (movements ?? []).filter(movement => {
      const movedOn = localDateKey(movement.movedAt)
      const matchesText = !query || [
        movement.itemName,
        movement.fromRoomName,
        movement.fromLocationName,
        movement.toRoomName,
        movement.toLocationName,
      ].some(value => value.toLocaleLowerCase().includes(query))
      return matchesText && (!fromDate || movedOn >= fromDate) && (!toDate || movedOn <= toDate)
    })
  }, [movements, search, fromDate, toDate])

  const hasFilters = Boolean(search.trim() || fromDate || toDate)

  function clearFilters() {
    setSearch('')
    setFromDate('')
    setToDate('')
  }

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">Inventory activity</p>
        <h1 className="mt-2 text-4xl">Movement history</h1>
        <p className="mt-2 max-w-2xl text-stone-500">
          See when belongings changed rooms or storage locations in this household.
        </p>
      </div>
      {movements && <div className="rounded-2xl border border-line bg-surface px-5 py-3 text-right shadow-card">
        <strong className="block text-2xl text-pine">{visibleMovements.length}</strong>
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          {hasFilters ? `shown of ${movements.length}` : movements.length === 1 ? 'recorded move' : 'recorded moves'}
        </span>
      </div>}
    </div>

    <div className="mt-7 rounded-[1.35rem] border border-line bg-white/70 p-3 shadow-card sm:p-4">
      <div className="mb-3 flex items-center gap-2 px-1 text-sm font-bold text-ink"><Icon name="history" className="h-4 w-4 text-pine" />Filter activity</div>
      <div className="grid gap-4 md:grid-cols-[minmax(16rem,1fr)_auto_auto_auto] md:items-end">
        <div>
          <label className="label" htmlFor="movement-search">Search history</label>
          <div className="relative">
            <Icon name="search" className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
            <input
              id="movement-search"
              className="field pl-10"
              type="search"
              placeholder="Item, room, or storage location"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="movement-from-date">From</label>
          <input
            id="movement-from-date"
            className="field md:w-auto"
            type="date"
            max={toDate || undefined}
            value={fromDate}
            onChange={event => setFromDate(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="movement-to-date">To</label>
          <input
            id="movement-to-date"
            className="field md:w-auto"
            type="date"
            min={fromDate || undefined}
            value={toDate}
            onChange={event => setToDate(event.target.value)}
          />
        </div>
        <button type="button" className="btn-secondary" disabled={!hasFilters} onClick={clearFilters}>
          <Icon name="x" className="h-4 w-4" />Clear filters
        </button>
      </div>
    </div>

    <div className="mt-7">
      {error ? <ErrorMessage message={error} /> : !movements ? <Loading /> : !visibleMovements.length ? (
        <Empty>
          {hasFilters
            ? 'No movements match that filter.'
            : 'No movements yet. Moving an item to another room or storage location will add it here.'}
        </Empty>
      ) : (
        <ol className="relative space-y-4 before:absolute before:bottom-6 before:left-6 before:top-6 before:w-px before:bg-line">
          {visibleMovements.map(movement => (
            <li className="card relative ml-0 pl-16" key={movement.id}>
              <span className="absolute left-[1.15rem] top-6 grid h-7 w-7 place-items-center rounded-full border-4 border-cream bg-pine text-xs text-white shadow-sm" aria-hidden="true"><Icon name="arrow-right" className="h-3.5 w-3.5" /></span>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg">{movement.itemName}</h2>
                  <p className="mt-1 text-sm text-stone-500">Item #{movement.itemId}</p>
                </div>
                <time className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600" dateTime={movement.movedAt}>
                  {dateTime.format(new Date(movement.movedAt))}
                </time>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="rounded-xl bg-stone-50 p-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">From</span>
                  <p className="mt-1 font-semibold">{locationLabel(movement.fromRoomName, movement.fromLocationName)}</p>
                </div>
                <span className="text-center text-xl text-pine" aria-hidden="true"><Icon name="arrow-right" className="mx-auto h-5 w-5" /></span>
                <div className="rounded-xl bg-sage/70 p-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-pine/70">To</span>
                  <p className="mt-1 font-semibold text-pine">{locationLabel(movement.toRoomName, movement.toLocationName)}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  </>
}
