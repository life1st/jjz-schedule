import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Permit, PermitType } from '../types/permit'

dayjs.extend(customParseFormat)

/**
 * Serializes an array of permits into a compact string format for URL sharing.
 * Format: [Type][YY][M_base36][D_base36]
 * Types: R = Regular, T = Temporary
 * Example: R2611 (2026-01-01)
 */
export const serializePermits = (permits: Permit[]): string => {
  return permits
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .map(p => {
      const typeChar = p.type === 'temporary' ? 'T' : 'R'
      const yearStr = dayjs(p.startDate).format('YY')
      const monthStr = (dayjs(p.startDate).month() + 1).toString(36) // 1-c
      const dayStr = dayjs(p.startDate).date().toString(36) // 1-v
      return `${typeChar}${yearStr}${monthStr}${dayStr}`
    })
    .join('')
}

/**
 * Deserializes a compact string back into an array of permits.
 */
export const deserializePermits = (data: string): Permit[] => {
  const permits: Permit[] = []
  // Match patterns like R2611 or T26ak
  const matches = data.match(/[RT]\d{2}[0-9a-z]{2}/g)

  if (!matches) return []

  matches.forEach((match, index) => {
    const typeChar = match[0]
    const year = parseInt(match.substring(1, 3), 10)
    const month = parseInt(match[3], 36)
    const day = parseInt(match[4], 36)
    
    const type: PermitType = typeChar === 'T' ? 'temporary' : 'regular'
    const startDate = dayjs()
      .year(2000 + year)
      .month(month - 1)
      .date(day)
      .startOf('day')
      .toDate()
    
    const duration = type === 'temporary' ? 15 : 7
    const endDate = dayjs(startDate).add(duration - 1, 'day').endOf('day').toDate()

    permits.push({
      id: `${Date.now()}-${index}`,
      startDate,
      endDate,
      type
    })
  })

  return permits
}
