import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryApi } from '../api/categoryApi'
import { ErrorMessage, Loading } from '../components/PageState'
import type { Category } from '../types'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(); const [form, setForm] = useState({name:'',color:'#174c3c'})
  const [editing, setEditing] = useState<number>(); const [error, setError] = useState('')
  const load = () => categoryApi.list().then(setCategories).catch(e => setError(e.message))
  useEffect(() => { load() }, [])
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); try { editing ? await categoryApi.update(editing,form) : await categoryApi.create(form); setForm({name:'',color:'#174c3c'}); setEditing(undefined); await load() } catch(e) { setError((e as Error).message) } }
  async function remove(category: Category) { if (confirm(`Delete “${category.name}”? Categories used by items cannot be deleted.`)) try { await categoryApi.remove(category.id); await load() } catch(e) { setError((e as Error).message) } }
  if (!categories) return <Loading />
  return <>
    <div><p className="eyebrow">Group related things</p><h1 className="mt-2 text-4xl">Categories</h1><p className="mt-2 text-stone-500">Simple labels make a growing inventory easy to scan and filter.</p></div>
    {error && <div className="mt-6"><ErrorMessage message={error} /></div>}
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="grid content-start gap-4 sm:grid-cols-2">{categories.map(category => <article className="card" key={category.id}><div className="flex items-start justify-between"><span className="h-4 w-4 rounded-full" style={{backgroundColor:category.color || '#78716c'}} /><div className="flex gap-1"><button className="btn-secondary px-3 py-2" onClick={() => {setEditing(category.id);setForm({name:category.name,color:category.color || '#174c3c'})}}>Edit</button><button className="btn-danger px-3 py-2" onClick={() => remove(category)}>Delete</button></div></div><h2 className="mt-5 text-xl">{category.name}</h2><Link to={`/items?categoryId=${category.id}`} className="mt-1 block text-sm text-pine">{category.itemCount} {category.itemCount === 1 ? 'item' : 'items'} →</Link></article>)}</section>
      <form className="card self-start" onSubmit={submit}><h2 className="text-xl">{editing ? 'Edit category' : 'Add a category'}</h2><div className="mt-4"><label className="label">Name *</label><input className="field" required maxLength={100} value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Electronics" /></div><div className="mt-4"><label className="label">Color *</label><div className="flex gap-3"><input aria-label="Category color" className="h-11 w-14 rounded-lg border p-1" type="color" value={form.color} onChange={e => setForm({...form,color:e.target.value})} /><input className="field" required pattern="#[0-9A-Fa-f]{6}" value={form.color} onChange={e => setForm({...form,color:e.target.value})} /></div></div><div className="mt-5 flex gap-2"><button className="btn-primary">{editing ? 'Save category' : 'Add category'}</button>{editing && <button type="button" className="btn-secondary" onClick={() => {setEditing(undefined);setForm({name:'',color:'#174c3c'})}}>Cancel</button>}</div></form>
    </div>
  </>
}
