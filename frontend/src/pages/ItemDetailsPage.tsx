import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { itemApi } from '../api/itemApi'
import ItemPhoto from '../components/ItemPhoto'
import { ErrorMessage, Loading } from '../components/PageState'
import type { Item } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function ItemDetailsPage() {
  const { id } = useParams(); const navigate = useNavigate()
  const [item, setItem] = useState<Item>(); const [error, setError] = useState('')
  useEffect(() => { itemApi.get(Number(id)).then(setItem).catch(e => setError(e.message)) }, [id])
  async function remove() {
    if (!item || !confirm(`Delete “${item.name}”? This cannot be undone.`)) return
    try { await itemApi.remove(item.id); navigate('/items') } catch (e) { setError((e as Error).message) }
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
    <Link to="/items" className="text-sm font-semibold text-pine">← Back to items</Link>
    <div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Item details</p><h1 className="mt-2 text-4xl">{item.name}</h1><p className="mt-3 text-stone-500">Home → {item.roomName}{item.storageLocationName && ` → ${item.storageLocationName}`}</p></div>
      <div className="flex gap-2"><Link className="btn-secondary" to={`/items/${item.id}/edit`}>Edit</Link><button className="btn-danger" onClick={remove}>Delete</button></div>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border bg-white shadow-soft" aria-label="Item photo">
          <ItemPhoto photoUrl={item.photoUrl} cacheKey={item.updatedAt} alt={`Photo of ${item.name}`} fallbackLabel={`No photo available for ${item.name}`} className="aspect-[16/10] w-full" loading="eager" />
        </section>
        <section className="card"><h2 className="text-xl">About this item</h2><p className="mt-4 whitespace-pre-line leading-relaxed text-stone-600">{item.description || 'No description has been added.'}</p></section>
        {item.notes && <section className="card"><h2 className="text-xl">Notes</h2><p className="mt-4 whitespace-pre-line text-stone-600">{item.notes}</p></section>}
      </div>
      <section className="card"><h2 className="text-xl">Inventory record</h2><dl className="mt-4 divide-y">{fields.map(([label,value]) => <div className="flex justify-between gap-4 py-3 text-sm" key={label}><dt className="text-stone-500">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>)}</dl>
        <p className="mt-5 text-xs text-stone-400">Added {new Date(item.createdAt).toLocaleDateString()} · Updated {new Date(item.updatedAt).toLocaleDateString()}</p>
      </section>
    </div>
  </>
}
