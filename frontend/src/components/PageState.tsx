export function Loading() { return <div className="card animate-pulse text-stone-500">Loading your inventory…</div> }
export function ErrorMessage({ message }: { message: string }) { return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{message}</div> }
export function Empty({ children }: { children: React.ReactNode }) { return <div className="card py-14 text-center text-stone-500">{children}</div> }
