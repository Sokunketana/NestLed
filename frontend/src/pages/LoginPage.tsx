import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { error, login } = useAuth()
  const denied = new URLSearchParams(window.location.search).has('loginError')

  return <main className="login-shell flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 sm:px-6">
    <section className="login-card-shell w-full max-w-sm">
      <div className="login-brand mb-7 text-center">
        <span className="login-brand-mark" aria-hidden="true">
          <span />
          <span />
        </span>
        <strong className="font-serif text-[1.65rem] leading-none tracking-tight text-deep">Nestled</strong>
      </div>

      <div className="login-panel p-6 sm:p-9">
        <h1 className="page-title text-center text-deep">Welcome back.</h1>
        <p className="mt-3 text-center leading-relaxed text-stone-600">Sign in to manage your home inventory.</p>
        {(denied || error) && <p role="alert" className="login-alert mt-6">{denied ? 'Sign-in could not be completed. Use a Google account with a verified email and try again.' : error}</p>}
        <button type="button" className="login-google-button mt-8 w-full" onClick={login}>
          <svg className="login-google-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.89-1.74 2.99-4.3 2.99-7.36Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.22-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.06v2.59A9.99 9.99 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.39 13.91A6.01 6.01 0 0 1 6.08 12c0-.66.11-1.3.31-1.91V7.5H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.5l3.33-2.59Z" />
            <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.96 2.99 14.7 2 12 2a9.99 9.99 0 0 0-8.94 5.5l3.33 2.59C7.18 7.72 9.39 5.96 12 5.96Z" />
          </svg>
          <span>Sign in with Google</span>
        </button>
        <p className="login-privacy mt-6 text-center text-xs leading-relaxed text-stone-400">Private to you and invited household members.</p>
      </div>

      <p className="login-caption mt-6 text-center text-xs text-stone-400">Your home, organized with care.</p>
    </section>
  </main>
}
