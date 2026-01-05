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
export const renderTileContent = (date: Date, permits: Permit[]) => {
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

  if (isDateInPermit(date, permits)) {
    content.push(<div key="marker" className="permit-marker"></div>)
  }
  
  return <div className="tile-content">{content}</div>
}

// Custom tile class name
export const getTileClassName = (date: Date, permits: Permit[]) => {
  if (isDateInPermit(date, permits)) {
    return 'has-permit'
  }
  return ''
}
