// @ts-ignore
import { Solar } from 'lunar-javascript'

export interface FestivalInfo {
  name: string
  isFullRange?: boolean // If true, it might be part of a multi-day festival range
}

export class FestivalUtil {
  /**
   * Returns a festival name if it falls into a custom defined category.
   * This supplements the official HolidayUtil which only has data for published years.
   */
  static getFestival(date: Date): string | null {
    const solar = Solar.fromDate(date)
    const lunar = solar.getLunar()
    const month = lunar.getMonth()
    const day = lunar.getDay()
    
    // 1. Lunar Festivals
    if (month === 1 && day === 1) return '春节'
    if (month === 5 && day === 5) return '端午节'
    if (month === 8 && day === 15) return '中秋节'

    // 2. Solar Festivals
    const solarMonth = solar.getMonth()
    const solarDay = solar.getDay()
    if (solarMonth === 1 && solarDay === 1) return '元旦'
    if (solarMonth === 5 && solarDay === 1) return '劳动节'
    if (solarMonth === 10 && solarDay === 1) return '国庆节'

    // 3. Tomb-sweeping (Solar term)
    if (lunar.getJieQi() === '清明') return '清明节'

    return null
  }

  /**
   * Checks if a date is within the Spring Festival "window" (Lunar 12-28 to 01-08)
   * where lunar dates are traditionally significant for planning.
   */
  static isInSpringFestivalRange(date: Date): boolean {
    const lunar = Solar.fromDate(date).getLunar()
    const month = lunar.getMonth()
    const day = lunar.getDay()
    return (month === 12 && day >= 28) || (month === 1 && day <= 8)
  }
}
