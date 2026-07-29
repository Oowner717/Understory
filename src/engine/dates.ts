const DAY_MS = 24 * 60 * 60 * 1000

function toDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`)
}

/** "today" / "yesterday" / "5 days ago" / "3 weeks ago" / "March 4" */
export function formatRelative(isoDate: string, todayIso: string): string {
  const days = Math.round((toDate(todayIso).getTime() - toDate(isoDate).getTime()) / DAY_MS)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  if (days < 61) return `${Math.round(days / 7)} weeks ago`
  return toDate(isoDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

/** "Tuesday, July 29" */
export function formatLong(isoDate: string): string {
  return toDate(isoDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

/** "July 29, 2026" */
export function formatFull(isoDate: string): string {
  return toDate(isoDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}
