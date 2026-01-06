import dayjs from 'dayjs'
// @ts-ignore
import { Solar, HolidayUtil } from 'lunar-javascript'
import { Permit } from '../types/permit'

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
  
  // Lunar Info
  const festivals = lunar.getFestivals()
  const lunarText = festivals.length > 0 ? festivals[0] : lunar.getDayInChinese()

  // Solar/Government Holiday Info
  const dateStr = dayjs(date).format('YYYY-MM-DD')
  const holidayData = HolidayUtil.getHoliday(dateStr)

  // Identify if holiday is a Lunar holiday
  const isLunarHoliday = holidayData && ['春节', '清明节', '端午节', '中秋节'].includes(holidayData.getName())

  let shouldShowLunar = false
  
  if (holidayData) {
      // Only show Lunar if it is a Lunar Festival (vacation or markup workday)
      shouldShowLunar = !!isLunarHoliday
  }

  if (holidayData && !holidayData.isWork()) {
    content.push(
      <div key="holiday" className="holiday-text">
        {holidayData.getName()}
      </div>
    )
  } else if (holidayData && holidayData.isWork()) {
    content.push(
      <div key="work" className="workday-text">班</div>
    )
  }

  if (shouldShowLunar) {
    content.push(
      <div key="lunar" className="lunar-text">
        {lunarText}
      </div>
    )
  }

  return <div className="tile-content">{content}</div>
}

// Custom tile class name
export const getTileClassName = (date: Date, permits: Permit[]) => {
  if (!isDateInPermit(date, permits)) return ''

  const classes = ['has-permit']
  const mDate = dayjs(date)
  
  const prevDay = mDate.subtract(1, 'day').toDate()
  const nextDay = mDate.add(1, 'day').toDate()

  const hasPrev = isDateInPermit(prevDay, permits)
  const hasNext = isDateInPermit(nextDay, permits)

  if (hasPrev && hasNext) {
    classes.push('is-middle')
  } else if (hasPrev) {
    classes.push('is-end')
  } else if (hasNext) {
    classes.push('is-start')
  } else {
    classes.push('is-single')
  }

  // Detect the "group finish" dates (12th, 24th, etc. permits WITHIN THE SAME YEAR)
  if (permits.length > 0) {
    const sortedAll = [...permits].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    const curDate = mDate.startOf('day')
    const curYear = mDate.year()

    // Filter permits that START in the same year as the current date being rendered
    const yearPermits = sortedAll.filter(p => dayjs(p.startDate).year() === curYear)

    // Check if this date is the endDate of the 12th, 24th... permit of THIS year
    const isGroupEnd = yearPermits.some((p, index) => {
      const isMultipleOf12 = (index + 1) % 12 === 0
      return isMultipleOf12 && curDate.isSame(dayjs(p.endDate).startOf('day'))
    })

    if (isGroupEnd) {
      classes.push('is-final')
    }
  }

  return classes.join(' ')
}
