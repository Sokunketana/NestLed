import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { error, login } = useAuth()
  const denied = new URLSearchParams(window.location.search).has('loginError')

  return <main className="grid min-h-screen place-items-center px-5 py-10">
    <section className="card w-full max-w-md p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pine text-2xl text-white">⌂</span>
      <p className="eyebrow mt-6">Home inventory</p>
      <h1 className="mt-2 text-4xl text-pine">Welcome to Nestled</h1>
      <p className="mt-3 text-stone-600">Sign in with an invited Google account to view and manage your home.</p>
      {(denied || error) && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {denied ? 'This Google account has not been invited.' : error}
      </p>}
      <button type="button" className="btn-primary mt-7 w-full" onClick={login}>Sign in with Google</button>
    </section>
  </main>
}
