export type SpaceColorOption = {
  value: string
  label: string
}

export const spaceColorOptions: SpaceColorOption[] = [
  { value: '#D96F55', label: 'Coral' },
  { value: '#D8A52B', label: 'Gold' },
  { value: '#145247', label: 'Pine' },
  { value: '#4F83CC', label: 'Blue' },
  { value: '#8A6FB8', label: 'Lavender' },
  { value: '#5D9C89', label: 'Sage' },
]

export const defaultRoomColor = spaceColorOptions[0].value
export const defaultLocationColor = spaceColorOptions[1].value

export function getSpaceColor(color: string | undefined, fallbackIndex = 0) {
  return color && /^#[0-9A-Fa-f]{6}$/.test(color)
    ? color
    : spaceColorOptions[Math.abs(fallbackIndex) % spaceColorOptions.length].value
}

export function withColorAlpha(color: string, alpha: string) {
  return `${color}${alpha}`
}
