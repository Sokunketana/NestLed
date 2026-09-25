import type { Category, Room, StorageLocation } from '../../types'

export type SetupData = {
  rooms: Room[]
  locations: StorageLocation[]
  categories: Category[]
}

export type SetupStep = 'room' | 'location' | 'category'

export type SetupStepDefinition = {
  id: SetupStep
  label: string
  anchorId: string
  title: string
  instruction: string
  hint: string
}

export type CoachmarkPosition = {
  top: number
  left: number
}

export type SetupGuideProps = {
  data: SetupData
}
