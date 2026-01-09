import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Permit, PermitType } from '../types/permit'

dayjs.extend(customParseFormat)

/**
 * Serializes an array of permits into a compact string format for URL sharing.
 * Format: [Type][YYMMDD]
 * Types: R = Regular, T = Temporary
 * Example: R260101T260215
 */
export const serializePermits = (permits: Permit[]): string => {
  return permits
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .map(p => {
      const typeChar = p.type === 'temporary' ? 'T' : 'R'
      const dateStr = dayjs(p.startDate).format('YYMMDD')
      return `${typeChar}${dateStr}`
    })
    .join('')
}

/**
 * Deserializes a compact string back into an array of permits.
 */
export const deserializePermits = (data: string): Permit[] => {
  const permits: Permit[] = []
  // Match patterns like R260101 or T260215
  const matches = data.match(/[RT]\d{6}/g)

  if (!matches) return []

  matches.forEach((match, index) => {
    const typeChar = match[0]
    const dateStr = match.substring(1)
    
    const type: PermitType = typeChar === 'T' ? 'temporary' : 'regular'
    const startDate = dayjs(dateStr, 'YYMMDD').startOf('day').toDate()
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
