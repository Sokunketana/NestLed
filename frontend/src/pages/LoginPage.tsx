import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { error, login } = useAuth()
  const denied = new URLSearchParams(window.location.search).has('loginError')

  return <main className="login-shell flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 sm:px-6">
    <section className="w-full max-w-sm">
      <div className="mb-7 text-center">
        <strong className="font-serif text-[1.65rem] leading-none tracking-tight text-deep">Nestled</strong>
      </div>

      <div className="login-panel p-6 sm:p-9">
        <h1 className="page-title text-center text-deep">Welcome back.</h1>
        <p className="mt-3 text-center leading-relaxed text-stone-600">Sign in to manage your home inventory.</p>
        {(denied || error) && <p role="alert" className="login-alert mt-6">{denied ? 'Sign-in could not be completed. Use a Google account with a verified email and try again.' : error}</p>}
        <button type="button" className="login-google-button mt-8 w-full" onClick={login}>Sign in with Google</button>
        <p className="mt-6 text-center text-xs leading-relaxed text-stone-400">Private to you and invited household members.</p>
      </div>
    </section>
  </main>
}
