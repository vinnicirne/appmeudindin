export function parseDateParts(dateStr?: string): { year: number; month: number; day?: number } | null {
  if (!dateStr) return null
  const clean = dateStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length >= 2) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    if (!Number.isNaN(year) && month >= 0 && month <= 11) {
      return { year, month, day: parts[2] ? parseInt(parts[2], 10) : undefined }
    }
  }
  return null
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return ''
  const clean = dateStr.split('T')[0]
  const [y, m, d] = clean.split('-')
  if (y && m && d) return `${d}/${m}/${y}`
  return clean
}

export function dateKey(dateStr?: string): string {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}
