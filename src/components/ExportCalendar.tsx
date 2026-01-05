import Calendar from 'react-calendar'
import dayjs from 'dayjs'
import { Permit } from '../types/permit'
import { renderTileContent, getTileClassName } from '../utils/calendarRenderer'
import 'react-calendar/dist/Calendar.css'

interface ExportCalendarProps {
  permits: Permit[]
  year: number
  id?: string
}

const MAX_PERMITS = 12

export const ExportCalendar = ({ permits, year, id = 'export-calendar' }: ExportCalendarProps) => {
  if (permits.length === 0) return null

  // Filter permits that START in this year for the quota display
  const yearStartsCount = permits.filter(p => dayjs(p.startDate).year() === year).length

  // Calculate range limited to the specific year
  const sortedPermits = [...permits].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  
  // Find effective start and end month for the target year
  // We only care about permits that overlap with the target year
  const yearStart = dayjs().year(year).startOf('year')
  const yearEnd = dayjs().year(year).endOf('year')

  // Filter permits that have any overlap with this year
  const yearPermits = sortedPermits.filter(p => {
    const pStart = dayjs(p.startDate)
    const pEnd = dayjs(p.endDate)
    return pStart.year() === year || pEnd.year() === year || (pStart.isBefore(yearStart) && pEnd.isAfter(yearEnd))
  })

  if (yearPermits.length === 0) return null // No permits for this year

  // Determine the month range to render
  // Start from the month of the first relevant permit (clipped to Jan)
  let startMonth = dayjs(yearPermits[0].startDate).startOf('month')
  if (startMonth.year() < year) startMonth = yearStart.startOf('month')

  // End at the month of the last relevant permit (clipped to Dec)
  let endMonth = dayjs(yearPermits[yearPermits.length - 1].endDate).endOf('month')
  if (endMonth.year() > year) endMonth = yearEnd.endOf('month')

  // Generate all months in range
  const months: Date[] = []
  let current = startMonth
  while (current.isBefore(endMonth) || current.isSame(endMonth, 'month')) {
    months.push(current.toDate())
    current = current.add(1, 'month')
  }

  return (
    <div 
      id={id}
      className="export-calendar-container"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: -9999,
        opacity: 0,
        pointerEvents: 'none',
        width: '1200px', // Fixed width for consistent export
        padding: '40px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>{year}年 进京证排期表</h1>
        <p style={{ fontSize: '18px', opacity: 0.9 }}>
          {year}年共安排 <strong>{yearStartsCount}</strong> / {MAX_PERMITS} 次进京证
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '24px',
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
      }}>
        {months.map((monthDate, index) => (
          <div key={index} className="single-calendar-wrapper">
             <h3 className="calendar-month-title" style={{ textAlign: 'center', color: '#333', marginBottom: '16px', fontWeight: 'bold' }}>
              {dayjs(monthDate).format('YYYY年 M月')}
            </h3>
            <Calendar
              activeStartDate={monthDate}
              tileContent={(args) => renderTileContent(args.date)}
              tileClassName={(args) => getTileClassName(args.date, permits)}
              locale="zh-CN"
              showNavigation={false}
              showNeighboringMonth={false}
              formatDay={(_, date) => dayjs(date).format('D')}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', opacity: 0.8 }}>
        生成时间：{dayjs().format('YYYY-MM-DD HH:mm:ss')}
      </div>
    </div>
  )
}
