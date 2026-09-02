import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryApi } from '../api/categoryApi'
import ConfirmationModal from '../components/ConfirmationModal'
import Icon from '../components/Icon'
import { ErrorMessage, Loading } from '../components/PageState'
import type { Category } from '../types'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>()
  const [form, setForm] = useState({ name: '', color: '#145247' })
  const [editing, setEditing] = useState<number>()
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Category>()

  const load = () => categoryApi.list().then(setCategories).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load categories.'))
  useEffect(() => { void load() }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      editing ? await categoryApi.update(editing, form) : await categoryApi.create(form)
      setForm({ name: '', color: '#145247' })
      setEditing(undefined)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save category.')
    }
  }

  async function remove() {
    if (!deleteTarget) return
    try {
      await categoryApi.remove(deleteTarget.id)
      await load()
      setDeleteTarget(undefined)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete category.')
    }
  }

  function cancelEdit() {
    setEditing(undefined)
    setForm({ name: '', color: '#145247' })
  }

  if (!categories) return <Loading />

  return <>
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="eyebrow">Group related things</p><h1 className="mt-2 text-4xl">Categories</h1><p className="mt-2 max-w-2xl text-stone-500">Simple labels make a growing inventory easy to scan and filter.</p></div>
      <div className="flex items-center gap-2 rounded-full bg-sage px-3.5 py-2 text-sm font-bold text-pine"><Icon name="tag" className="h-4 w-4" />{categories.length} {categories.length === 1 ? 'category' : 'categories'}</div>
    </div>
    {error && <div className="mt-6"><ErrorMessage message={error} /></div>}

    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_24rem]">
      <section className="grid content-start gap-4 sm:grid-cols-2" aria-label="Categories">
        <div className="flex items-center justify-between px-1 sm:col-span-2"><p className="text-sm font-bold text-ink">Your labels</p><span className="text-xs text-ink-soft">Use them to make search effortless</span></div>
        {categories.map(category => <article className="card group relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-soft" key={category.id}>
          <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: category.color || '#78716c' }} />
          <div className="flex items-start justify-between gap-3 pt-1"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cream text-pine"><Icon name="tag" className="h-5 w-5" /></span><div className="flex gap-1"><button type="button" title={`Edit ${category.name}`} aria-label={`Edit ${category.name}`} className="btn-secondary h-9 w-9 p-0" onClick={() => { setEditing(category.id); setForm({ name: category.name, color: category.color || '#145247' }) }}><Icon name="edit" className="h-4 w-4" /></button><button type="button" title={`Delete ${category.name}`} aria-label={`Delete ${category.name}`} className="btn-danger h-9 w-9 p-0" onClick={() => setDeleteTarget(category)}><Icon name="trash" className="h-4 w-4" /></button></div></div>
          <h2 className="mt-5 text-xl group-hover:text-pine">{category.name}</h2><Link to={`/items?categoryId=${category.id}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-pine">{category.itemCount} {category.itemCount === 1 ? 'item' : 'items'} <Icon name="arrow-right" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></Link>
        </article>)}
        {!categories.length && <div className="card border-dashed py-14 text-center sm:col-span-2"><Icon name="tag" className="mx-auto h-7 w-7 text-pine" /><p className="mt-3 font-semibold">No categories yet.</p><p className="mt-1 text-sm text-ink-soft">Add a label to make your first items easier to find.</p></div>}
      </section>

      <form className="card self-start" onSubmit={submit}>
        <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-amber-700"><Icon name="tag" className="h-4 w-4" /></span><div><h2 className="text-xl">{editing ? 'Edit category' : 'Add a category'}</h2><p className="mt-1 text-sm text-ink-soft">Choose a simple label you’ll recognize at a glance.</p></div></div>
        <div className="mt-5"><label className="label">Name *</label><input className="field" required maxLength={100} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Electronics" /></div>
        <div className="mt-4"><label className="label">Color *</label><div className="flex gap-3"><input aria-label="Category color" className="h-11 w-14 cursor-pointer rounded-xl border-line bg-white p-1" type="color" value={form.color} onChange={event => setForm({ ...form, color: event.target.value })} /><input className="field" required pattern="#[0-9A-Fa-f]{6}" value={form.color} onChange={event => setForm({ ...form, color: event.target.value })} /></div></div>
        <div className="mt-5 flex gap-2"><button className="btn-primary"><Icon name={editing ? 'check' : 'plus'} className="h-4 w-4" />{editing ? 'Save category' : 'Add category'}</button>{editing && <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>}</div>
      </form>
    </div>
    {deleteTarget && <ConfirmationModal title={`Delete “${deleteTarget.name}”?`} description="This category can only be deleted when no items use it." onClose={() => setDeleteTarget(undefined)} onConfirm={remove} />}
  </>
}
