import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import type { Category, Room, StorageLocation } from '../types'

export type SetupData = {
  rooms: Room[]
  locations: StorageLocation[]
  categories: Category[]
}

type SetupStep = 'room' | 'location' | 'category'

const steps: Array<{
  id: SetupStep
  label: string
  icon: 'home' | 'map' | 'tag'
  anchorId: string
  title: string
  instruction: string
  hint: string
}> = [
  {
    id: 'room',
    label: 'Create a room',
    icon: 'home',
    anchorId: 'quick-add',
    title: 'Your first mission: create a room',
    instruction: 'Open Quick add, choose Add room, and give your first space a name.',
    hint: 'Try a big space such as Kitchen, Bedroom, or Garage.',
  },
  {
    id: 'location',
    label: 'Add a location',
    icon: 'map',
    anchorId: 'quick-add',
    title: 'Next mission: add a location',
    instruction: 'Use Quick add again, choose Add location, and place it inside your room.',
    hint: 'A location is a smaller spot, such as Pantry shelf or Top drawer.',
  },
  {
    id: 'category',
    label: 'Add a category',
    icon: 'tag',
    anchorId: 'category-form',
    title: 'Final mission: add a category',
    instruction: 'Open the category form and create a label you can use for your items.',
    hint: 'Useful examples include Kitchenware, Electronics, or Documents.',
  },
]

export default function SetupGuide({ data }: { data: SetupData }) {
  const step: SetupStep = !data.rooms.length ? 'room' : !data.locations.length ? 'location' : 'category'
  const stepIndex = steps.findIndex(item => item.id === step)
  const activeStep = steps[stepIndex]
  const target = step === 'category' ? '/categories#category-form' : `/rooms?setup=${step}#quick-add`
  const coachmarkRef = useRef<HTMLElement>(null)
  const [coachmarkPosition, setCoachmarkPosition] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    function updateCoachmarkPosition() {
      const targetElement = document.getElementById(activeStep.anchorId)
      const coachmark = coachmarkRef.current
      if (!targetElement || !coachmark) return

      const targetRect = targetElement.getBoundingClientRect()
      const coachmarkRect = coachmark.getBoundingClientRect()
      const margin = 16
      const gap = 16
      const maxLeft = Math.max(margin, window.innerWidth - coachmarkRect.width - margin)
      const maxTop = Math.max(margin, window.innerHeight - coachmarkRect.height - margin)
      const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
      const leftOfTarget = targetRect.left - coachmarkRect.width - gap
      const rightOfTarget = targetRect.right + gap
      const aboveTarget = targetRect.top - coachmarkRect.height - gap
      const belowTarget = targetRect.bottom + gap

      let left = clamp(targetRect.left - coachmarkRect.width - gap, margin, maxLeft)
      let top = clamp(targetRect.top, margin, maxTop)

      if (leftOfTarget >= margin) {
        left = leftOfTarget
      } else if (rightOfTarget + coachmarkRect.width <= window.innerWidth - margin) {
        left = rightOfTarget
      } else if (aboveTarget >= margin) {
        left = clamp(targetRect.left + (targetRect.width - coachmarkRect.width) / 2, margin, maxLeft)
        top = aboveTarget
      } else if (belowTarget + coachmarkRect.height <= window.innerHeight - margin) {
        left = clamp(targetRect.left + (targetRect.width - coachmarkRect.width) / 2, margin, maxLeft)
        top = belowTarget
      } else {
        top = maxTop
      }

      setCoachmarkPosition({ top, left })
    }

    updateCoachmarkPosition()
    window.addEventListener('resize', updateCoachmarkPosition)
    window.addEventListener('scroll', updateCoachmarkPosition, true)
    return () => {
      window.removeEventListener('resize', updateCoachmarkPosition)
      window.removeEventListener('scroll', updateCoachmarkPosition, true)
    }
  }, [activeStep.anchorId, activeStep.id])

  return <>
    <section className="mb-8 overflow-hidden rounded-2xl border border-pine/20 bg-mint shadow-card" aria-label="Getting started guide">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><p className="eyebrow">Getting started</p><h1 className="mt-2 text-2xl sm:text-3xl">Let’s set up your home</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">Follow the highlighted steps in the sidebar. We’ll create the structure you need before you add your first item.</p></div>
        </div>

        <div className="mt-6 grid gap-2 border-t border-pine/10 pt-5 sm:grid-cols-3 sm:gap-3">
          {steps.map((item, index) => {
            const complete = index < stepIndex
            const active = item.id === step
            return <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${active ? 'bg-white shadow-sm' : ''}`} key={item.id}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${complete ? 'bg-pine text-white' : active ? 'bg-sage text-pine' : 'bg-white/60 text-stone-400'}`}><Icon name={complete ? 'check' : item.icon} className="h-4 w-4" /></span>
              <span className={`text-sm font-semibold ${active || complete ? 'text-deep' : 'text-stone-500'}`}>{item.label}</span>
            </div>
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-pine/10 bg-white/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sage text-pine"><Icon name={activeStep.icon} className="h-4 w-4" /></span><p className="text-sm text-ink-soft"><strong className="text-deep">Next: {activeStep.label}.</strong> {activeStep.instruction}</p></div>
        <Link className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-pine hover:text-deep" to={target}>Show me <Icon name="arrow-right" className="h-4 w-4" /></Link>
      </div>
    </section>

    <aside
      ref={coachmarkRef}
      aria-label="Tutorial hint"
      className={`pointer-events-none fixed z-40 w-[min(24rem,calc(100vw-2rem))] ${coachmarkPosition ? '' : 'bottom-3 right-3'}`}
      style={coachmarkPosition ? { top: coachmarkPosition.top, left: coachmarkPosition.left } : undefined}
    >
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border-2 border-pine bg-deep p-4 text-white shadow-2xl sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage text-pine shadow-sm"><Icon name="sparkles" className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3"><p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-200">Tutorial objective</p><span className="rounded-full bg-white/10 px-2 py-1 text-[0.65rem] font-bold text-emerald-100">{stepIndex + 1}/{steps.length}</span></div>
            <h2 className="mt-1 text-lg text-white">{activeStep.title}</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-emerald-50">{activeStep.instruction}</p>
        <div className="mt-3 rounded-xl bg-white/10 px-3 py-2.5 text-xs leading-relaxed text-emerald-100"><strong className="text-white">Hint:</strong> {activeStep.hint}</div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-label={`Tutorial progress: step ${stepIndex + 1} of ${steps.length}`}>
            {steps.map((item, index) => <span key={item.id} className={`h-1.5 rounded-full ${index <= stepIndex ? 'w-6 bg-emerald-200' : 'w-2 bg-white/25'}`} />)}
          </div>
          <Link className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-bold text-pine transition hover:bg-emerald-50" to={target}>Let’s do it <Icon name="arrow-right" className="h-4 w-4" /></Link>
        </div>
      </div>
    </aside>
  </>
}
