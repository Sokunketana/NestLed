import Icon from './Icon'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'

type SpaceActionsMenuProps = {
  name: string
  onDelete: () => void
  onEdit: () => void
  onMove?: () => void
}

export default function SpaceActionsMenu({ name, onDelete, onEdit, onMove }: SpaceActionsMenuProps) {
  return <DropdownMenu>
    <DropdownMenuTrigger
      className="grid h-8 w-8 place-items-center rounded-lg text-stone-700 transition hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/30"
      aria-label={`Actions for ${name}`}
    >
      <Icon name="more-horizontal" className="h-4 w-4" />
    </DropdownMenuTrigger>
    <DropdownMenuContent aria-label={`Actions for ${name}`} className="w-36">
      <DropdownMenuItem onSelect={onEdit}><Icon name="edit" className="h-4 w-4" />Edit</DropdownMenuItem>
      {onMove && <DropdownMenuItem onSelect={onMove}><Icon name="map" className="h-4 w-4" />Move</DropdownMenuItem>}
      <DropdownMenuItem variant="destructive" onSelect={onDelete}><Icon name="trash" className="h-4 w-4" />Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
}
