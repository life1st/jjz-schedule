import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import dayjs from 'dayjs'
import { Permit } from '../types/permit'
import { renderTileContent, getTileClassName } from '../utils/calendarRenderer'
import { ExportCalendar } from '../components/ExportCalendar'
import { ExportDevice, DEVICE_CONFIGS } from '../constants/export'
import 'react-calendar/dist/Calendar.css'
import './SchedulePage.scss'
import { toPng } from 'html-to-image'

const STORAGE_KEY = 'jjz-schedule-permits'
const PERMIT_DURATION_DAYS = 7

function SchedulePage() {
  const [permits, setPermits] = useState<Permit[]>([])
  const [exportDevice, setExportDevice] = useState<ExportDevice>('auto')

  // Helper to update state and localStorage simultaneously
  const updatePermits = (newPermits: Permit[]) => {
    setPermits(newPermits)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPermits))
  }

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
      updatePermits(permits.filter((p) => p.id !== existingPermit.id))
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

    // Add new permit
    const newPermit: Permit = {
      id: Date.now().toString(),
      startDate: newStartDate.toDate(),
      endDate: newEndDate.toDate(),
    }

    updatePermits([...permitsAfterRemoval, newPermit].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()))
  }

  // Remove a permit by ID
  const removePermit = (id: string) => {
    updatePermits(permits.filter((p) => p.id !== id))
  }

  // Clear all permits
  const handleClearAll = () => {
    if (permits.length === 0) return
    if (window.confirm('确定要清空所有已排期的日期吗？此操作无法撤销。')) {
      updatePermits([])
    }
  }

  const [viewDate, setViewDate] = useState(new Date())
  const [isExporting, setIsExporting] = useState(false)

  // Year Selection
  const currentYear = viewDate.getFullYear()

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

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i) // Current year +/- 5 years

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10)
    setViewDate(dayjs(viewDate).year(newYear).toDate())
  }

  const handleExportImage = async () => {
    // If not exporting, start the process
    setIsExporting(true)
    
    // Give React time to mount the component
    // We use a small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 300))

    const element = document.getElementById('export-calendar')
    if (!element) {
      setIsExporting(false)
      return
    }

    const config = DEVICE_CONFIGS[exportDevice]

    try {
      const dataUrl = await toPng(element, {
        cacheBust: true,
        width: config.width,
        height: config.height || element.offsetHeight || element.scrollHeight,
        style: {
          opacity: '1',
          zIndex: 'auto',
          visibility: 'visible',
          pointerEvents: 'auto'
        }
      })

      const link = document.createElement('a')
      link.download = `进京证排期_${exportDevice}_${currentYear}_${dayjs().format('YYYYMMDD')}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Export failed:', error)
      alert('图片导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="schedule-page">
      {isExporting && <ExportCalendar permits={permits} year={currentYear} device={exportDevice} />}
      
      <header className="page-header">
        <h1>进京证排期工具</h1>
        <p className="subtitle">
          当前已排期 <strong>{permits.length}</strong> 次进京证
          {permits.length > 0 && <span style={{ marginLeft: '1rem', opacity: 0.8 }}>(共 {Math.ceil(permits.length / 12)} 组)</span>}
        </p>
        <div className="export-controls">
          <div className="device-selector">
            {(['auto', 'desktop', 'ipad', 'iphone'] as ExportDevice[]).map(d => (
              <button
                key={d}
                className={`device-btn ${exportDevice === d ? 'active' : ''}`}
                onClick={() => setExportDevice(d)}
              >
                {d === 'auto' ? '长图' : d.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            className="export-btn"
            onClick={handleExportImage}
            title="导出为图片"
          >
            📸 导出
          </button>
        </div>
      </header>

      <div className="content-container">
        <div className="calendar-section">
          <div className="calendar-controls">
            <button onClick={handlePrevMonth} className="nav-btn">&lt; 上个月</button>

            <div className="year-selector">
              <select value={currentYear} onChange={handleYearChange} className="year-select">
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
            </div>

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
                    tileContent={(args) => renderTileContent(args.date)}
                    tileClassName={(args) => getTileClassName(args.date, permits)}
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
          <div className="permits-header">
            <h2>已选日期列表</h2>
            {permits.length > 0 && (
              <button
                onClick={handleClearAll}
                className="clear-all-btn"
                title="清空所有排期"
              >
                重置/清空
              </button>
            )}
          </div>

          {permits.length === 0 ? (
            <p className="empty-message">暂无已选日期，点击日历上的日期开始添加</p>
          ) : (
              <div className="permits-list">
                {Object.entries(
                  permits.reduce((acc, p) => {
                    const year = dayjs(p.startDate).year();
                    if (!acc[year]) acc[year] = [];
                    acc[year].push(p);
                    return acc;
                  }, {} as Record<number, Permit[]>)
                )
                  .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA)) // Sort years descending
                  .map(([year, yearPermits]) => (
                    <div key={year} className="year-group">
                      <h2 className="year-title">{year} 年排期计划</h2>
                      {Array.from({ length: Math.ceil(yearPermits.length / 12) }).map((_, groupIndex) => (
                        <div key={groupIndex} className="permit-group">
                          <h3 className="group-title">
                            {year}年 第 {groupIndex + 1} 轮平移 (周期间隔)
                          </h3>
                          <ul className="group-items">
                            {yearPermits.slice(groupIndex * 12, (groupIndex + 1) * 12).map((permit, index) => {
                              const globalIndex = groupIndex * 12 + index;
                              return (
                                <li key={permit.id} className="permit-item">
                                  <div className="permit-info">
                              <span className="permit-number">#{globalIndex + 1}</span>
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
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
              </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SchedulePage
