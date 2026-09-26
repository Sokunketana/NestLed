import type { Category } from '../../types'

export type AddCategoryModalProps = {
  onClose: () => void
  onSaved: (category: Category) => void | Promise<void>
}
