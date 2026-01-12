import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Permit, PermitType } from '../types/permit'

dayjs.extend(customParseFormat)

/**
 * Serializes an array of permits into a compact string format for URL sharing.
 * Format: $[YYYY][Type][M_base36][D_base36]...
 * Types: R = Regular, T = Temporary
 * Example: $2026R11T5k
 * Multi-year: $2025Rck$2026R11
 */
export const serializePermits = (permits: Permit[], filterYear?: number): string => {
  const sortedPermits = [...permits].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  
  const permitsByYear: Record<number, Permit[]> = {}
  sortedPermits.forEach(p => {
    const y = dayjs(p.startDate).year()
    if (filterYear !== undefined && y !== filterYear) return
    if (!permitsByYear[y]) permitsByYear[y] = []
    permitsByYear[y].push(p)
  })

  let result = ''
  const years = Object.keys(permitsByYear).map(Number).sort()
  
  years.forEach(year => {
    result += `$${year}`
    permitsByYear[year].forEach(p => {
      const typeChar = p.type === 'temporary' ? 'T' : 'R'
      const monthStr = (dayjs(p.startDate).month() + 1).toString(36)
      const dayStr = dayjs(p.startDate).date().toString(36)
      result += `${typeChar}${monthStr}${dayStr}`
    })
  })
  
  return result
}

/**
 * Deserializes a compact string back into an array of permits.
 */
export const deserializePermits = (data: string): Permit[] => {
  if (!data) return []

  // Check if it's the new format (starts with $)
  if (!data.startsWith('$')) {
    // Falls back to old format check (YYYY followed by [RT]) or legacy format
    const yearMatches = data.match(/\d{4}(?:[RT][0-9a-z]{2})*/g)
    if (!yearMatches) return []
    
    const permits: Permit[] = []
    yearMatches.forEach(block => {
      const year = parseInt(block.substring(0, 4), 10)
      const permitData = block.substring(4)
      const matches = permitData.match(/[RT][0-9a-z]{2}/g)
      if (!matches) return
      matches.forEach((match, index) => {
        const typeChar = match[0]
        const month = parseInt(match[1], 36)
        const day = parseInt(match[2], 36)
        const type: PermitType = typeChar === 'T' ? 'temporary' : 'regular'
        const startDate = dayjs().year(year).month(month - 1).date(day).startOf('day').toDate()
        const duration = type === 'temporary' ? 15 : 7
        const endDate = dayjs(startDate).add(duration - 1, 'day').endOf('day').toDate()
        permits.push({ id: `${Date.now()}-${year}-${index}`, startDate, endDate, type })
      })
    })
    return permits
  }

  const permits: Permit[] = []
  // Split by $ and filter empty strings
  const blocks = data.split('$').filter(Boolean)

  blocks.forEach(block => {
    const year = parseInt(block.substring(0, 4), 10)
    const permitData = block.substring(4)
    const matches = permitData.match(/[RT][0-9a-z]{2}/g)
    if (!matches) return

    matches.forEach((match, index) => {
      const typeChar = match[0]
      const month = parseInt(match[1], 36)
      const day = parseInt(match[2], 36)
      
      const type: PermitType = typeChar === 'T' ? 'temporary' : 'regular'
      const startDate = dayjs()
        .year(year)
        .month(month - 1)
        .date(day)
        .startOf('day')
        .toDate()
      
      const duration = type === 'temporary' ? 15 : 7
      const endDate = dayjs(startDate).add(duration - 1, 'day').endOf('day').toDate()

      permits.push({
        id: `${Date.now()}-${year}-${index}`,
        startDate,
        endDate,
        type
      })
    })
  })

  return permits
}

/**
 * Loads permits from localStorage with robust fallback support.
 * Prioritizes compact format (deserializePermits), falls back to legacy JSON.
 */
export const loadPermitsFromStorage = (key: string): Permit[] => {
  const stored = localStorage.getItem(key)
  if (!stored) return []

  try {
    // 1. Try compact format
    const permits = deserializePermits(stored)
    if (permits.length > 0) return permits

    // 2. Fallback to legacy JSON
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        return parsed.map((p: any) => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
          type: p.type || 'regular',
        }))
      }
    } catch (e) {
      console.warn('Stored data is neither compact format nor valid JSON array')
    }
  } catch (error) {
    console.error('Failed to load permits:', error)
  }

  return []
}
