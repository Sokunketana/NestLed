import Icon from './Icon'

export function Loading() { return <div className="card flex items-center gap-3 text-stone-500"><span className="grid h-9 w-9 animate-pulse place-items-center rounded-xl bg-sage text-pine"><Icon name="sparkles" className="h-4 w-4" /></span><span>Loading your inventory…</span></div> }
export function ErrorMessage({ message }: { message: string }) { return <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-100 text-sm font-bold">!</span><span>{message}</span></div> }
export function Empty({ children }: { children: React.ReactNode }) { return <div className="card py-14 text-center text-stone-500"><Icon name="sparkles" className="mx-auto h-7 w-7 text-pine" /><p className="mx-auto mt-3 max-w-md">{children}</p></div> }
