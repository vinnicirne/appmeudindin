export { cn } from "cn"

type CategoryLike = {
  id?: string
  slug?: string
  label?: string
  name?: string
  title?: string
}

export function getCategoryDisplayName(cat: CategoryLike | null | undefined) {
  if (!cat) return ''
  return cat.label || cat.name || cat.title || cat.slug || cat.id || ''
}

export function buildCategoryLabelMap(categories: CategoryLike[] = []) {
  const map: Record<string, string> = {}
  for (const cat of categories) {
    const label = getCategoryDisplayName(cat)
    if (cat.id) map[cat.id] = label
    if (cat.slug) map[cat.slug] = label
  }
  return map
}
