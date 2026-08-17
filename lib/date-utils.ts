// lib/date-utils.ts

// Returns today's date as YYYY-MM-DD in the LOCAL timezone.
// Deliberately does NOT use toISOString(), since that returns UTC and
// causes an off-by-one-day bug in timezones ahead of UTC (like Blantyre,
// UTC+2) during the early morning hours right after local midnight.
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface DaySetting {
  day: number
  date: string | null
}

// Matches today's real local date against configured retreat day dates.
// Returns null if the retreat hasn't started yet (no day matches today).
export function getCurrentRetreatDay(daySettings: DaySetting[]): number | null {
  const todayStr = getLocalDateString()
  const match = daySettings.find((s) => s.date === todayStr)
  return match?.day ?? null
}