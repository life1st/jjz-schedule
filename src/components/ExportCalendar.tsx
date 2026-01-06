import Calendar from 'react-calendar'
import dayjs from 'dayjs'
import { Permit } from '../types/permit'
import { renderTileContent, getTileClassName } from '../utils/calendarRenderer'
import 'react-calendar/dist/Calendar.css'
import { QRCodeSVG } from 'qrcode.react'

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
        width: `${config.width}px`,
        height: config.height ? `${config.height}px` : 'auto',
        minHeight: config.height ? `${config.height}px` : 'auto',
        padding: config.padding,
        '--export-scale': config.scale,
        justifyContent: (device === 'auto' || device === 'iphone') ? 'flex-start' : 'center'
      } as React.CSSProperties}
    >
      <div className="export-header">
        <div className="header-content">
          <div className="header-info">
            <h1>{year}年 进京证排期全览</h1>
            <p>
              {year}年共安排 <strong>{yearStartsCount}</strong> / {MAX_PERMITS} 次进京证
            </p>
          </div>
          <div className="header-qr">
            <QRCodeSVG
              value="https://bjjjz.vercel.app"
              size={Math.round(110 * config.scale)}
              level="M"
              bgColor="rgba(255,255,255,0.1)"
              fgColor="white"
            />
          </div>
        </div>
      </div>

      <div className="export-grid" style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}>
        {months.map((monthDate, index) => (
          <div key={index} className="single-calendar-wrapper export-item">
            <h3 className="calendar-month-title">
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

      <div className="export-footer">
        © {dayjs().year()} 进京证排期工具 (bjjjz.vercel.app) | 生成时间：{dayjs().format('YYYY-MM-DD')}
      </div>
    </div>
  )
}
