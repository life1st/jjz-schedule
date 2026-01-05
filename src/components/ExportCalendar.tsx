import Calendar from 'react-calendar'
import dayjs from 'dayjs'
import { Permit } from '../types/permit'
import { renderTileContent, getTileClassName } from '../utils/calendarRenderer'
import 'react-calendar/dist/Calendar.css'

import { ExportDevice, DEVICE_CONFIGS } from '../constants/export'

interface ExportCalendarProps {
  permits: Permit[]
  year: number
  device: ExportDevice
  id?: string
}

const MAX_PERMITS = 12

export const ExportCalendar = ({ permits, year, device, id = 'export-calendar' }: ExportCalendarProps) => {
  if (permits.length === 0) return null

  const config = DEVICE_CONFIGS[device]

  // Filter permits that START in this year for the quota display
  const yearStartsCount = permits.filter(p => dayjs(p.startDate).year() === year).length

  // Calculate range limited to the specific year
  const sortedPermits = [...permits].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  
  // Find effective start and end month for the target year
  const yearStart = dayjs().year(year).startOf('year')
  const yearEnd = dayjs().year(year).endOf('year')

  // Filter permits that have any overlap with this year
  const yearPermits = sortedPermits.filter(p => {
    const pStart = dayjs(p.startDate)
    const pEnd = dayjs(p.endDate)
    return pStart.year() === year || pEnd.year() === year || (pStart.isBefore(yearStart) && pEnd.isAfter(yearEnd))
  })

  if (yearPermits.length === 0) return null

  let startMonth = dayjs(yearPermits[0].startDate).startOf('month')
  if (startMonth.year() < year) startMonth = yearStart.startOf('month')

  let endMonth = dayjs(yearPermits[yearPermits.length - 1].endDate).endOf('month')
  if (endMonth.year() > year) endMonth = yearEnd.endOf('month')

  const months: Date[] = []
  let current = startMonth
  while (current.isBefore(endMonth) || current.isSame(endMonth, 'month')) {
    months.push(current.toDate())
    current = current.add(1, 'month')
  }

  return (
    <div 
      id={id}
      className={`export-calendar-container device-${device}`}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: -9999,
        opacity: 0,
        pointerEvents: 'none',
        width: `${config.width}px`,
        height: config.height ? `${config.height}px` : 'auto',
        minHeight: config.height ? `${config.height}px` : 'auto',
        padding: config.padding,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: device !== 'auto' ? 'center' : 'flex-start',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: `${50 * config.scale}px` }}>
        <h1 style={{ fontSize: `${56 * config.scale}px`, fontWeight: 'bold', marginBottom: `${16 * config.scale}px`, textShadow: `0 ${4 * config.scale}px ${12 * config.scale}px rgba(0,0,0,0.2)` }}>
          {year}年 进京证排期全览
        </h1>
        <p style={{ fontSize: `${24 * config.scale}px`, opacity: 0.9 }}>
          {year}年共安排 <strong>{yearStartsCount}</strong> / {MAX_PERMITS} 次进京证
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${config.cols}, 1fr)`, 
        gap: `${24 * config.scale}px`,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: `${32 * config.scale}px`,
        borderRadius: `${24 * config.scale}px`,
        boxShadow: `0 ${20 * config.scale}px ${60 * config.scale}px rgba(0, 0, 0, 0.3)`,
        margin: '0 auto',
        width: 'fit-content'
      }}>
        {months.map((monthDate, index) => (
          <div key={index} className="single-calendar-wrapper" style={{ zoom: config.scale }}>
            <h3 className="calendar-month-title" style={{ textAlign: 'center', color: '#1a237e', marginBottom: `${16}px`, fontWeight: 'bold', fontSize: `${18}px` }}>
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

      <div style={{ marginTop: `${60 * config.scale}px`, textAlign: 'center', fontSize: `${20 * config.scale}px`, opacity: 0.7 }}>
        生成于：{dayjs().format('YYYY-MM-DD HH:mm:ss')} | 4K 高清壁纸
      </div>
    </div>
  )
}
