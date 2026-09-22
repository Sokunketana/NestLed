import Icon from './Icon'

export default function LoadingScreen() {
  return <main className="loading-screen" aria-busy="true" aria-live="polite">
    <div className="loading-screen__glow loading-screen__glow--top" aria-hidden="true" />
    <div className="loading-screen__glow loading-screen__glow--bottom" aria-hidden="true" />

    <section className="loading-card">
      <div className="loading-visual" aria-hidden="true">
        <span className="loading-ring loading-ring--outer" />
        <span className="loading-ring loading-ring--inner" />
        <span className="loading-mark"><Icon name="home" className="h-8 w-8" /></span>
      </div>

      <h1 className="loading-title">Making room for your home.</h1>
      <p className="loading-description">Checking your session and preparing your inventory…</p>

      <div className="loading-progress" aria-hidden="true"><span /></div>
      <div className="loading-status">
        <span className="loading-dots" aria-hidden="true"><i /><i /><i /></span>
        <span>Getting things ready</span>
      </div>
    </section>
  </main>
}
