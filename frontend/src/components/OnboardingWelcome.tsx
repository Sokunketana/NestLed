import Icon, { type IconName } from './Icon'

const setupSteps: Array<{ icon: IconName; title: string; description: string }> = [
  { icon: 'home', title: 'Create a room', description: 'Start with a space such as a kitchen or bedroom.' },
  { icon: 'map', title: 'Add a location', description: 'Choose a smaller spot inside that room, like a drawer.' },
  { icon: 'tag', title: 'Create a category', description: 'Organize items with labels such as Electronics or Documents.' },
]

export default function OnboardingWelcome({ onStart }: { onStart: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4 py-6 backdrop-blur-sm">
    <section
      aria-label="Welcome to Nestled"
      aria-modal="true"
      className="w-full max-w-2xl rounded-3xl border border-pine/15 bg-white p-5 text-ink shadow-2xl sm:p-8"
      role="dialog"
    >
      <div className="flex items-start gap-4">
        <div>
          <p className="eyebrow">Welcome to Nestled</p>
          <h1 className="mt-2 text-2xl sm:text-3xl">Let’s set up your home together</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
            Before you add an item, we’ll create the simple structure that gives everything a place.
            We’ll guide you through three quick steps.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {setupSteps.map((step, index) => <div className="rounded-2xl border border-line bg-cream/60 p-4" key={step.title}>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-pine shadow-sm">
              <Icon name={step.icon} className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">0{index + 1}</span>
          </div>
          <h2 className="mt-4 font-semibold text-deep">{step.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.description}</p>
        </div>)}
      </div>

      <div className="mt-7 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-soft">Once these are ready, you’ll be ready to add your first item.</p>
        <button type="button" className="btn-primary shrink-0" onClick={onStart}>
          Start setup <Icon name="arrow-right" className="h-4 w-4" />
        </button>
      </div>
    </section>
  </div>
}
