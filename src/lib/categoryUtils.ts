export function buildCategoryMap(dbCategories: any[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const cat of dbCategories) {
    const label = cat.label || cat.name || cat.title || cat.slug || 'Sem categoria'
    if (cat.id) map[cat.id] = label
    if (cat.slug) map[cat.slug] = label
  }
  return map
}

export function buildCategoryColorsMap(dbCategories: any[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const cat of dbCategories) {
    const color = cat.color || 'bg-gray-400'
    if (cat.id) map[cat.id] = color
    if (cat.slug) map[cat.slug] = color
  }
  return map
}
