import HomeTree from '../components/HomeTree'

export default function HomeTreePage() {
  return <>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">Browse your home</p>
        <h1 className="page-title mt-2">Home tree</h1>
        <p className="mt-2 max-w-2xl text-stone-500">Follow your rooms, storage locations, and the items inside them.</p>
      </div>
    </div>

    <div className="mt-8">
      <HomeTree variant="page" />
    </div>
  </>
}
