import type { IconName } from '../Icon'

export type OnboardingWelcomeProps = {
  onStart: () => void
}

export type OnboardingStep = {
  icon: IconName
  title: string
  description: string
}
