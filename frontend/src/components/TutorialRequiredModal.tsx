import Icon from './Icon'

type TutorialRequiredModalProps = {
  stepLabel: string
  onContinue: () => void
}

export default function TutorialRequiredModal({ stepLabel, onContinue }: TutorialRequiredModalProps) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4 py-6 backdrop-blur-sm">
    <section
      aria-label="Tutorial required"
      aria-modal="true"
      className="w-full max-w-md rounded-3xl border border-pine/15 bg-white p-5 text-ink shadow-2xl sm:p-7"
      role="dialog"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage text-pine">
          <Icon name="map" className="h-5 w-5" />
        </span>
        <div>
          <p className="eyebrow">Setup in progress</p>
          <h2 className="mt-2 text-2xl">Complete the tutorial first</h2>
        </div>
      </div>
      <p className="mt-4 leading-relaxed text-ink-soft">
        Finish creating your first room, location, and category before switching to another part of Nestled.
        Your next step is to {stepLabel}.
      </p>
      <div className="mt-7 flex justify-end">
        <button type="button" className="btn-primary" onClick={onContinue}>Continue setup <Icon name="arrow-right" className="h-4 w-4" /></button>
      </div>
    </section>
  </div>
}
