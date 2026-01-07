import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import dayjs from 'dayjs'
import { Permit } from '../types/permit'
import { CalendarLegend } from '../components/CalendarLegend'
import { SummaryInfo } from '../components/SummaryInfo'
import { GapItem } from '../components/GapItem'
import { renderTileContent, getTileClassName } from '../utils/calendarRenderer'
import { ExportCalendar } from '../components/ExportCalendar'
import { ExportDevice, DEVICE_CONFIGS } from '../constants/export'
import 'react-calendar/dist/Calendar.css'
import './SchedulePage.scss'
import { toPng } from 'html-to-image'

const STORAGE_KEY = 'jjz-schedule-permits'
function SchedulePage() {
  const [permits, setPermits] = useState<Permit[]>([])
  const [exportDevice, setExportDevice] = useState<ExportDevice>('auto')
  const [isTempMode, setIsTempMode] = useState(false)

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
          type: p.type || 'regular', // Default to regular for legacy data
        }))
        setPermits(permitsWithDates)
      } catch (error) {
        console.error('Failed to load permits:', error)
      }
    }
  }, [])

  // Handle date click
  const handleDateClick = (date: Date) => {
    const currentType = isTempMode ? 'temporary' : 'regular'
    const duration = isTempMode ? 15 : 7

    // Check if clicking on an existing permit OF THE SAME TYPE to remove it
    const existingPermit = permits.find((permit) => {
      if (permit.type !== currentType) return false
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
    const newEndDate = dayjs(date).add(duration - 1, 'day').endOf('day')

    // Find all permits OF THE SAME TYPE that would overlap with the new permit
    const conflictingPermits = permits.filter((permit) => {
      if (permit.type !== currentType) return false
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
      type: currentType,
    }

    updatePermits([...permitsAfterRemoval, newPermit].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()))

    if (isTempMode) {
      setIsTempMode(false)
    }
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
  const regularInYear = permits.filter(p => dayjs(p.startDate).year() === currentYear && (!p.type || p.type === 'regular'))
  const shiftCount = Math.floor(Math.max((regularInYear.length - 1) / 12, 0))

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
        <SummaryInfo
          year={currentYear}
          regularCount={regularInYear.length}
          shiftCount={shiftCount}
        />
        <div className="export-controls">
          <div className="device-selector">
            {(['auto', 'desktop', 'ipad', 'iphone'] as ExportDevice[]).map(d => (
              <button
                key={d}
                className={`device-btn ${exportDevice === d ? 'active' : ''}`}
                onClick={() => setExportDevice(d)}
              >
                {d === 'auto' ? '自适应' : d.toUpperCase()}
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
                    calendarType="gregory"
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

          <CalendarLegend
            isTempMode={isTempMode}
            setIsTempMode={setIsTempMode}
            showToggle={true}
          />
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
                  .map(([year, yearPermits]) => {
                    // Sort all permits in this year chronologically
                    const sortedYearPermits = [...yearPermits].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

                    // Grouping logic: New group starts when we hit a regular permit AND already have 12
                    const groups: Permit[][] = [];
                    let currentGroup: Permit[] = [];
                    let regularInCurrent = 0;

                    sortedYearPermits.forEach(p => {
                      const isRegular = !p.type || p.type === 'regular';
                      if (isRegular && regularInCurrent === 12) {
                        groups.push(currentGroup);
                        currentGroup = [];
                        regularInCurrent = 0;
                      }
                      currentGroup.push(p);
                      if (isRegular) regularInCurrent++;
                    });
                    if (currentGroup.length > 0) groups.push(currentGroup);

                    let globalRegularCounter = 0;

                    return (
                      <div key={year} className="year-group">
                        <h2 className="year-title">
                          <strong>{year}</strong>
                          <span className="title-text"> 年排期计划</span>
                        </h2>
                        
                        <div className="year-groups-container">
                          {groups.map((group, groupIndex) => {
                            const hasRegular = group.some(p => !p.type || p.type === 'regular');
                            return (
                              <div key={`${year}-${groupIndex}`} className={`permit-group ${!hasRegular ? 'temp-group' : ''}`}>
                                <h3 className="group-title">
                                  <div className="title-left">
                                    <span className="title-text">第 </span>
                                    <strong>{groupIndex + 1}</strong>
                                    <span className="title-text"> 轮排期计划</span>
                                  </div>
                                  <button
                                    className="group-remove-btn"
                                    onClick={() => {
                                      if (window.confirm(`确定要删除第 ${groupIndex + 1} 轮的所有排期吗？`)) {
                                        const groupIds = group.map(p => p.id);
                                        updatePermits(permits.filter(p => !groupIds.includes(p.id)));
                                      }
                                    }}
                                    title="删除本轮所有日期"
                                  >
                                    删除本轮
                                  </button>
                                </h3>
                                <ul className="group-items">
                                  {group.map((permit) => {
                                    const isTemp = permit.type === 'temporary';
                                    if (!isTemp) globalRegularCounter++;

                                    // Calculate gap with previous permit in the year
                                    const currentIdx = sortedYearPermits.findIndex(p => p.id === permit.id);
                                    const prevPermit = currentIdx > 0 ? sortedYearPermits[currentIdx - 1] : null;

                                    return (
                                      <>
                                        {prevPermit && (
                                          <GapItem
                                            prevEndDate={prevPermit.endDate}
                                            currentStartDate={permit.startDate}
                                          />
                                        )}
                                        <li className={`permit-item ${isTemp ? 'is-temp' : ''}`}>
                                          <div className="permit-info">
                                            <span className="permit-number">
                                              {isTemp ? '临' : `#${globalRegularCounter - groupIndex * 12}`}
                                            </span>
                                            <span className="permit-dates">
                                              {dayjs(permit.startDate).format('MM-DD')} 至{' '}
                                              {dayjs(permit.endDate).format('MM-DD')}
                                            </span>
                                          </div>
                                          <button
                                            className="remove-button"
                                            onClick={() => removePermit(permit.id)}
                                            aria-label="删除此次排期"
                                          >
                                            ✕
                                          </button>
                                        </li>
                                      </>
                                    );
                                  })}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SchedulePage
