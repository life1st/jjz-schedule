import dayjs from 'dayjs'
// @ts-ignore
import { Solar, HolidayUtil } from 'lunar-javascript'
import { Permit } from '../types/permit'
import { FestivalUtil } from './FestivalUtil'

// Check if a date is within any existing permit
export const isDateInPermit = (date: Date, permits: Permit[]): boolean => {
  return permits.some((permit) => {
    const checkDate = dayjs(date).startOf('day')
    const start = dayjs(permit.startDate).startOf('day')
    const end = dayjs(permit.endDate).startOf('day')
    return checkDate.isSame(start) || checkDate.isSame(end) || (checkDate.isAfter(start) && checkDate.isBefore(end))
  })
}

// Custom tile content to highlight permit dates
export const renderTileContent = (date: Date) => {
  const content = []

  const solar = Solar.fromDate(date)
  const lunar = solar.getLunar()
  
  // Basic Lunar date (e.g. "初一", "腊月廿八")
  const lunarDateText = lunar.getDayInChinese()

  // Solar/Government Holiday Info
  const dateStr = dayjs(date).format('YYYY-MM-DD')
  const holidayData = HolidayUtil.getHoliday(dateStr)
  const festivalName = FestivalUtil.getFestival(date)

  // Decide what name to display (Priority: Official Holiday > Custom Festival)
  const holidayName = holidayData && !holidayData.isWork() ? holidayData.getName() : null
  const displayedName = holidayName || festivalName

  // Determine if we should show the lunar subtitle
  const lunarHolidays = ['春节', '清明节', '端午节', '中秋节']
  let shouldShowLunar = (holidayData && lunarHolidays.includes(holidayData.getName())) ||
    (!holidayData && festivalName && lunarHolidays.includes(festivalName)) ||
    FestivalUtil.isInSpringFestivalRange(date)

  if (displayedName && (!holidayData || !holidayData.isWork())) {
    content.push(
      <div key="holiday" className="holiday-text">
        {displayedName}
      </div>
    )
  } else if (holidayData && holidayData.isWork()) {
    content.push(
      <div key="work" className="workday-text">班</div>
    )
  }

  // Lunar Subtitle Rendering
  if (shouldShowLunar) {
    content.push(
      <div key="lunar" className="lunar-text">
        {lunarDateText}
      </div>
    )
  }

  return <div className="tile-content">{content}</div>
}

// Custom tile class name
export const getTileClassName = (date: Date, permits: Permit[]) => {
  const checkDate = dayjs(date).startOf('day')
  const classes: string[] = []

  const regularPermits = permits.filter(p => !p.type || p.type === 'regular')
  const tempPermits = permits.filter(p => p.type === 'temporary')

  // Regular Permits Logic
  if (isDateInPermit(date, regularPermits)) {
    classes.push('has-permit')
    const isStart = regularPermits.some((p) => checkDate.isSame(dayjs(p.startDate).startOf('day')))
    const isEnd = regularPermits.some((p) => checkDate.isSame(dayjs(p.endDate).startOf('day')))
    const isInMiddle = regularPermits.some((p) => {
      const start = dayjs(p.startDate).startOf('day')
      const end = dayjs(p.endDate).startOf('day')
      return checkDate.isAfter(start) && checkDate.isBefore(end)
    })

    if (isStart && isEnd) {
      classes.push('is-single')
    } else if (isStart) {
      classes.push('is-start')
    } else if (isEnd) {
      classes.push('is-end')
    } else if (isInMiddle) {
      classes.push('is-middle')
    }

    // Detect the "group finish" dates for regular permits
    const sortedRegular = [...regularPermits].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    const curYear = checkDate.year()
    const yearPermits = sortedRegular.filter(p => dayjs(p.startDate).year() === curYear)

    const isGroupEnd = yearPermits.some((p, index) => {
      const isMultipleOf12 = (index + 1) % 12 === 0
      return isMultipleOf12 && checkDate.isSame(dayjs(p.endDate).startOf('day'))
    })

    if (isGroupEnd) {
      classes.push('is-final')
    }
  }

  // Temporary Permits Logic
  if (isDateInPermit(date, tempPermits)) {
    classes.push('has-temp-permit')
    const isStart = tempPermits.some((p) => checkDate.isSame(dayjs(p.startDate).startOf('day')))
    const isEnd = tempPermits.some((p) => checkDate.isSame(dayjs(p.endDate).startOf('day')))
    const isInMiddle = tempPermits.some((p) => {
      const start = dayjs(p.startDate).startOf('day')
      const end = dayjs(p.endDate).startOf('day')
      return checkDate.isAfter(start) && checkDate.isBefore(end)
    })

    if (isStart) classes.push('is-temp-start')
    if (isEnd) classes.push('is-temp-end')
    if (isInMiddle) classes.push('is-temp-middle')
  }

  // Today's Date Logic
  if (checkDate.isSame(dayjs().startOf('day'))) {
    classes.push('is-today')
  }

  // Official Holiday/Workday Logic
  const holidayData = HolidayUtil.getHoliday(checkDate.format('YYYY-MM-DD'))
  if (holidayData && holidayData.isWork()) {
    classes.push('is-workday')
  }

  return classes.join(' ')
}
