import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { itemApi } from '../api/itemApi'
import ConfirmationModal from '../components/ConfirmationModal'
import ItemPhoto from '../components/ItemPhoto'
import { ErrorMessage, Loading } from '../components/PageState'
import Icon from '../components/Icon'
import type { Item } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function ItemDetailsPage() {
  const { id } = useParams(); const navigate = useNavigate()
  const [item, setItem] = useState<Item>(); const [error, setError] = useState('')
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  useEffect(() => { itemApi.get(Number(id)).then(setItem).catch(e => setError(e.message)) }, [id])
  async function remove() {
    if (!item) return
    await itemApi.remove(item.id)
    navigate('/items')
  }
  if (error) return <ErrorMessage message={error} />
  if (!item) return <Loading />
  const valueEach = item.estimatedValue == null ? 'Not recorded' : money.format(item.estimatedValue)
  const totalValue = item.estimatedValue == null ? 'Not recorded' : money.format(item.estimatedValue * item.quantity)
  const fields = [
    ['Category', item.categoryName], ['Condition', item.condition], ['Quantity', item.quantity],
    ['Value each', valueEach], ['Total value', totalValue],
    ['Purchase date', item.purchaseDate || 'Not recorded'], ['Warranty expires', item.warrantyExpirationDate || 'Not recorded'],
  ]
  return <>
    <Link to="/items" className="inline-flex items-center gap-2 text-sm font-bold text-pine"><Icon name="arrow-left" className="h-4 w-4" />Back to items</Link>
    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="eyebrow">Item details</p><h1 className="page-title mt-2 break-words">{item.name}</h1><p className="mt-3 break-words text-sm text-stone-500">Home → {item.roomName} → {item.storageLocationName}</p></div>
      <div className="flex w-full gap-2 sm:w-auto"><Link className="btn-secondary flex-1 sm:flex-none" to={`/items/${item.id}/edit`}><Icon name="edit" className="h-4 w-4" />Edit</Link><button className="btn-danger flex-1 sm:flex-none" onClick={() => setShowDeleteConfirmation(true)}><Icon name="trash" className="h-4 w-4" />Delete</button></div>
    </div>
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
    {showDeleteConfirmation && <ConfirmationModal title={`Delete “${item.name}”?`} description="This item and its inventory record will be permanently deleted. This action cannot be undone." onClose={() => setShowDeleteConfirmation(false)} onConfirm={remove} />}
  </>
}
