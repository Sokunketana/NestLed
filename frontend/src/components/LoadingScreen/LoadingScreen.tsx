export default function LoadingScreen({ message }: { message?: string }) {
  return (
    <main className="loading-screen" aria-busy="true" role="status" aria-label="Loading">
      <div className="loading-screen__glow loading-screen__glow--top" aria-hidden="true" />
      <div className="loading-screen__glow loading-screen__glow--bottom" aria-hidden="true" />

      <div className="loading-visual" aria-hidden="true">
        <span className="loading-ring loading-ring--outer" />
        <span className="loading-ring loading-ring--inner" />
        <span className="loading-core">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="m5 14 11-9 11 9v12H5V14Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M12 26v-8h8v8M9 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {message && <p className="absolute bottom-12 px-4 text-center text-sm text-stone-600">{message}</p>}
    </main>
  )
}
