import { useAuth } from '../auth/AuthContext'
import Icon from '../components/Icon'

export default function LoginPage() {
  const { error, login } = useAuth()
  const denied = new URLSearchParams(window.location.search).has('loginError')

  return <main className="relative grid min-h-screen overflow-hidden px-4 py-4 lg:grid-cols-[1.08fr_.92fr] lg:gap-4 lg:p-6">
    <section className="relative hidden overflow-hidden rounded-[2rem] bg-deep p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[40px] border-coral/20" aria-hidden="true" />
      <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-white/[0.04]" aria-hidden="true" />
      <div className="relative flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-coral/20 text-sage"><Icon name="home" className="h-5 w-5" /></span><strong className="font-serif text-2xl">Nestled</strong></div>
      <div className="relative max-w-xl">
        <p className="eyebrow text-emerald-200">A calmer way to keep track</p>
        <h1 className="mt-4 text-5xl leading-[1.05] text-white xl:text-6xl">Everything has a place.</h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-emerald-100/80">Keep the details of your home close at hand—from the passport in the top drawer to the spare charger in the guest room.</p>
      </div>
      <p className="relative text-sm text-emerald-100/60">Your household, beautifully organized.</p>
    </section>

    <section className="flex items-center justify-center py-8 sm:py-12">
      <div className="card w-full max-w-md p-7 sm:p-9">
        <div className="flex items-center gap-3 lg:hidden"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-deep text-sage"><Icon name="home" className="h-5 w-5" /></span><strong className="font-serif text-2xl text-deep">Nestled</strong></div>
        <p className="eyebrow mt-8 lg:mt-0">Home inventory</p>
        <h2 className="mt-2 text-4xl text-deep">Welcome back.</h2>
        <p className="mt-3 leading-relaxed text-stone-600">Sign in to view and manage the things that make your home yours.</p>
        {(denied || error) && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{denied ? 'Sign-in could not be completed. Use a Google account with a verified email and try again.' : error}</p>}
        <button type="button" className="btn-primary mt-7 w-full py-3" onClick={login}><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-pine">G</span>Sign in with Google</button>
        <p className="mt-6 text-center text-xs leading-relaxed text-stone-400">Your inventory is private to you and the household members you invite.</p>
      </div>
    </section>
  </main>
}
