import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import dayjs from 'dayjs'
// @ts-ignore
import { Solar, HolidayUtil } from 'lunar-javascript'
import { Permit } from '../types/permit'
import 'react-calendar/dist/Calendar.css'
import './SchedulePage.scss'

const STORAGE_KEY = 'jjz-schedule-permits'
const MAX_PERMITS = 12
const PERMIT_DURATION_DAYS = 7

function SchedulePage() {
  const [permits, setPermits] = useState<Permit[]>([])

  // Load permits from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const permitsWithDates = parsed.map((p: any) => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
        }))
        setPermits(permitsWithDates)
      } catch (error) {
        console.error('Failed to load permits:', error)
      }
    }
  }, [])

  // Save permits to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permits))
  }, [permits])

  // Check if a date is within any existing permit
  const isDateInPermit = (date: Date): boolean => {
    return permits.some((permit) => {
      const checkDate = dayjs(date).startOf('day')
      const start = dayjs(permit.startDate).startOf('day')
      const end = dayjs(permit.endDate).startOf('day')
      return checkDate.isSame(start) || checkDate.isSame(end) || (checkDate.isAfter(start) && checkDate.isBefore(end))
    })
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    // Check if clicking on an existing permit to remove it
    const existingPermit = permits.find((permit) => {
      const checkDate = dayjs(date).startOf('day')
      const start = dayjs(permit.startDate).startOf('day')
      const end = dayjs(permit.endDate).startOf('day')
      return checkDate.isSame(start) || checkDate.isSame(end) || (checkDate.isAfter(start) && checkDate.isBefore(end))
    })

    if (existingPermit) {
      // Remove the permit
      setPermits(permits.filter((p) => p.id !== existingPermit.id))
      return
    }

    // Calculate new permit date range
    const newStartDate = dayjs(date).startOf('day')
    const newEndDate = dayjs(date).add(PERMIT_DURATION_DAYS - 1, 'day').endOf('day')

    // Find all permits that would overlap with the new permit
    const conflictingPermits = permits.filter((permit) => {
      const existingStart = dayjs(permit.startDate).startOf('day')
      const existingEnd = dayjs(permit.endDate).startOf('day')
      
      // Check if there's any overlap
      return (
        // New permit starts during existing permit
        (newStartDate.isSame(existingStart) || newStartDate.isSame(existingEnd) || 
         (newStartDate.isAfter(existingStart) && newStartDate.isBefore(existingEnd))) ||
        // New permit ends during existing permit
        (newEndDate.isSame(existingStart) || newEndDate.isSame(existingEnd) || 
         (newEndDate.isAfter(existingStart) && newEndDate.isBefore(existingEnd))) ||
        // New permit completely contains existing permit
        (newStartDate.isBefore(existingStart) && newEndDate.isAfter(existingEnd))
      )
    })

    // Remove conflicting permits
    const permitsAfterRemoval = permits.filter(
      (p) => !conflictingPermits.some((cp) => cp.id === p.id)
    )

    // Check if we've reached the maximum number of permits after removing conflicts
    if (permitsAfterRemoval.length >= MAX_PERMITS) {
      alert(`最多只能添加 ${MAX_PERMITS} 次进京证`)
      return
    }

    // Add new permit
    const newPermit: Permit = {
      id: Date.now().toString(),
      startDate: newStartDate.toDate(),
      endDate: newEndDate.toDate(),
    }

    setPermits([...permitsAfterRemoval, newPermit].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()))
  }

  // Custom tile content to highlight permit dates
  const tileContent = ({ date }: { date: Date }) => {
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

    if (isDateInPermit(date)) {
      content.push(<div key="marker" className="permit-marker"></div>)
    }
    
    return <div className="tile-content">{content}</div>
  }

  // Custom tile class name
  const tileClassName = ({ date }: { date: Date }) => {
    if (isDateInPermit(date)) {
      return 'has-permit'
    }
    return ''
  }

  // Remove a permit by ID
  const removePermit = (id: string) => {
    setPermits(permits.filter((p) => p.id !== id))
  }

  const [viewDate, setViewDate] = useState(new Date())

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(dayjs(viewDate).subtract(1, 'month').toDate())
  }

  const handleNextMonth = () => {
    setViewDate(dayjs(viewDate).add(1, 'month').toDate())
  }

  const handleToday = () => {
    setViewDate(new Date())
  }

  return (
    <div className="schedule-page">
      <header className="page-header">
        <h1>进京证排期工具</h1>
        <p className="subtitle">
          已使用 <strong>{permits.length}</strong> / {MAX_PERMITS} 次
        </p>
      </header>

      <div className="content-container">
        <div className="calendar-section">
          <div className="calendar-controls">
            <button onClick={handlePrevMonth} className="nav-btn">&lt; 上个月</button>
            <button onClick={handleToday} className="nav-btn today-btn">今天</button>
            <button onClick={handleNextMonth} className="nav-btn">下个月 &gt;</button>
          </div>

          <div className="calendars-row">
            {[0, 1, 2].map((offset) => {
              const currentDate = dayjs(viewDate).add(offset, 'month')
              return (
                <div key={offset} className="single-calendar-wrapper">
                  <h3 className="calendar-month-title">
                    {currentDate.format('YYYY年 M月')}
                  </h3>
                  <Calendar
                    activeStartDate={currentDate.toDate()}
                    onClickDay={handleDateClick}
                    tileContent={tileContent}
                    tileClassName={tileClassName}
                    locale="zh-CN"
                    showNavigation={false}
                    showNeighboringMonth={false}
                    formatDay={(_, date) => dayjs(date).format('D')}
                  />
                </div>
              )
            })}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-marker has-permit"></span>
              <span>已选日期（点击可删除，重叠日期自动合并）</span>
            </div>
          </div>
        </div>

        <div className="permits-section">
          <h2>已选日期列表</h2>
          {permits.length === 0 ? (
            <p className="empty-message">暂无已选日期，点击日历上的日期开始添加</p>
          ) : (
            <ul className="permits-list">
              {permits.map((permit, index) => (
                <li key={permit.id} className="permit-item">
                  <div className="permit-info">
                    <span className="permit-number">#{index + 1}</span>
                    <span className="permit-dates">
                      {dayjs(permit.startDate).format('YYYY-MM-DD')} 至{' '}
                      {dayjs(permit.endDate).format('YYYY-MM-DD')}
                    </span>
                    <span className="permit-duration">（{PERMIT_DURATION_DAYS} 天）</span>
                  </div>
                  <button
                    className="remove-button"
                    onClick={() => removePermit(permit.id)}
                    aria-label="删除此进京证"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default SchedulePage
