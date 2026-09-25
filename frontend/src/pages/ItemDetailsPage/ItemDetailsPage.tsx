import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { itemApi } from '../../api/itemApi'
import { itemMovementApi } from '../../api/itemMovementApi'
import { cacheKeys, revalidateInventory } from '../../api/cache'
import { roomApi } from '../../api/roomApi'
import { storageLocationApi } from '../../api/storageLocationApi'
import BulkMoveItemsModal from '../../components/BulkMoveItemsModal'
import ConfirmationModal from '../../components/ConfirmationModal'
import ItemPhoto from '../../components/ItemPhoto'
import { ErrorMessage, Loading } from '../../components/PageState'
import Icon from '../../components/Icon'
import SpaceActionsMenu from '../../components/SpaceActionsMenu'
import type { BulkMoveItemsResponse, Item, ItemMovement, Room, StorageLocation } from '../../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function ItemDetailsPage() {
  const { id } = useParams(); const navigate = useNavigate()
  const { data: item, error } = useSWR<Item>(id ? cacheKeys.item(Number(id)) : null, () => itemApi.get(Number(id)))
  const { data: movements, error: movementsError } = useSWR<ItemMovement[]>(id ? cacheKeys.movements : null, itemMovementApi.list)
  const { data: rooms } = useSWR<Room[]>(cacheKeys.rooms, roomApi.list)
  const { data: locations } = useSWR<StorageLocation[]>(cacheKeys.locations, storageLocationApi.list)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [moveSuccess, setMoveSuccess] = useState('')
  async function remove() {
    if (!item) return
    await itemApi.remove(item.id)
    await revalidateInventory({ dashboard: true, items: true, locations: true, movements: true, rooms: true })
    navigate(`/?roomId=${item.roomId}&locationId=${item.storageLocationId}`)
  }
  async function finishMove(result: BulkMoveItemsResponse) {
    await revalidateInventory({ dashboard: true, items: true, itemDetails: true, locations: true, movements: true, rooms: true })
    setShowMoveDialog(false)
    setMoveSuccess(`Moved to ${result.roomName} → ${result.storageLocationName}.`)
  }
  if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Unable to load this item.'} />
  if (!item) return <Loading />
  const valueEach = item.estimatedValue == null ? 'Not recorded' : money.format(item.estimatedValue)
  const totalValue = item.estimatedValue == null ? 'Not recorded' : money.format(item.estimatedValue * item.quantity)
  const itemMovements = (movements ?? []).filter(movement => movement.itemId === item.id)
  const fields = [
    ['Category', item.categoryName], ['Condition', item.condition], ['Quantity', item.quantity],
    ['Value each', valueEach], ['Total value', totalValue],
    ['Purchase date', item.purchaseDate || 'Not recorded'], ['Warranty expires', item.warrantyExpirationDate || 'Not recorded'],
  ]
  return <>
    <Link to={`/?roomId=${item.roomId}&locationId=${item.storageLocationId}`} className="inline-flex items-center gap-2 text-sm font-bold text-pine"><Icon name="arrow-left" className="h-4 w-4" />Back to {item.storageLocationName}</Link>
    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h1 className="page-title break-words">{item.name}</h1><p className="mt-3 break-words text-sm text-stone-500">Home → {item.roomName} → {item.storageLocationName}</p></div>
      <div className="flex w-full justify-end sm:w-auto"><SpaceActionsMenu name={item.name} onEdit={() => navigate(`/items/${item.id}/edit`)} onMove={() => { setMoveSuccess(''); setShowMoveDialog(true) }} onDelete={() => setShowDeleteConfirmation(true)} /></div>
    </div>
    {moveSuccess && <p role="status" className="mt-4 rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-emerald-800">{moveSuccess}</p>}
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[1.35rem] border border-line bg-surface shadow-card" aria-label="Item photo">
          <ItemPhoto photoUrl={item.photoUrl} cacheKey={item.updatedAt} alt={`Photo of ${item.name}`} fallbackLabel={`No photo available for ${item.name}`} className="aspect-[16/10] w-full" loading="eager" expandable />
        </section>
        <section className="card"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-sage text-pine"><Icon name="box" className="h-4 w-4" /></span><h2 className="text-xl">About this item</h2></div><p className="mt-4 whitespace-pre-line leading-relaxed text-stone-600">{item.description || 'No description has been added.'}</p></section>
        {item.notes && <section className="card"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-amber-700"><Icon name="tag" className="h-4 w-4" /></span><h2 className="text-xl">Notes</h2></div><p className="mt-4 whitespace-pre-line text-stone-600">{item.notes}</p></section>}
      </div>
      <section className="card"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-coral/10 text-coral"><Icon name="sliders" className="h-4 w-4" /></span><h2 className="min-w-0 text-xl">Inventory record</h2></div><dl className="mt-4 divide-y">{fields.map(([label,value]) => <div className="flex justify-between gap-4 py-3 text-sm" key={label}><dt className="shrink-0 text-stone-500">{label}</dt><dd className="min-w-0 break-words text-right font-semibold">{value}</dd></div>)}</dl>
        <p className="mt-5 text-xs text-stone-400">Added {new Date(item.createdAt).toLocaleDateString()} · Updated {new Date(item.updatedAt).toLocaleDateString()}</p>
      </section>
    </div>
    <section className="card mt-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-amber-700"><Icon name="history" className="h-4 w-4" /></span><h2 className="text-xl">Movement history</h2></div>{movementsError ? <p className="mt-4 text-sm text-red-700">Unable to load movement history.</p> : !movements ? <p className="mt-4 text-sm text-ink-soft">Loading movement history…</p> : itemMovements.length ? <div className="mt-5 space-y-4">{itemMovements.map(movement => <div className="relative border-l-2 border-sage pl-4" key={movement.id}><span className="absolute -left-[0.4rem] top-0.5 h-2.5 w-2.5 rounded-full bg-pine ring-4 ring-sage/40" /><p className="text-sm font-semibold">{movement.fromRoomName} / {movement.fromLocationName} <span className="font-normal text-stone-400">to</span> {movement.toRoomName} / {movement.toLocationName}</p><p className="mt-1 text-xs text-stone-400">{new Date(movement.movedAt).toLocaleString()}</p></div>)}</div> : <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm leading-relaxed text-ink-soft">No moves recorded. This item has stayed here since it was added.</p>}</section>
    {showMoveDialog && rooms && locations && <BulkMoveItemsModal itemIds={[item.id]} rooms={rooms} locations={locations} onClose={() => setShowMoveDialog(false)} onMoved={finishMove} />}
    {showDeleteConfirmation && <ConfirmationModal title={`Delete “${item.name}”?`} description="This item and its inventory record will be permanently deleted. This action cannot be undone." onClose={() => setShowDeleteConfirmation(false)} onConfirm={remove} />}
  </>
}
