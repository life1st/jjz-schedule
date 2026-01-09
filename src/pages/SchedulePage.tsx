import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Calendar from 'react-calendar'
import dayjs from 'dayjs'
import { Permit, Plan } from '../types/permit'
import { CalendarLegend } from '../components/CalendarLegend'
import { SummaryInfo } from '../components/SummaryInfo'
import { GapItem } from '../components/GapItem'
import { Copyright } from '../components/Copyright'
import { renderTileContent, getTileClassName } from '../utils/calendarRenderer'
import { ExportCalendar } from '../components/ExportCalendar'
import { ExportDevice, DEVICE_CONFIGS } from '../constants/export'
import 'react-calendar/dist/Calendar.css'
import './SchedulePage.scss'
import { toJpeg } from 'html-to-image'
import { serializePermits, deserializePermits } from '../utils/shareUtils'

const STORAGE_KEY = 'jjz-schedule-permits'
const PLANS_STORAGE_KEY = 'jjz-schedule-plans'

function SchedulePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [permits, setPermits] = useState<Permit[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [exportDevice, setExportDevice] = useState<ExportDevice>('auto')
  const [isTempMode, setIsTempMode] = useState(false)

  // Helper to update state and localStorage simultaneously
  const updatePermits = (newPermits: Permit[]) => {
    setPermits(newPermits)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPermits))

    // Also update current plan if it exists
    if (currentPlanId) {
      const updatedPlans = plans.map(p =>
        p.id === currentPlanId ? { ...p, permits: newPermits } : p
      )
      setPlans(updatedPlans)
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(updatedPlans))
    }
  }

  const updatePlans = (newPlans: Plan[], activePlanId: string | null = currentPlanId) => {
    setPlans(newPlans)
    setCurrentPlanId(activePlanId)
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(newPlans))
  }

  // Load permits and plans from localStorage on mount
  useEffect(() => {
    // 1. Load Plans
    const storedPlans = localStorage.getItem(PLANS_STORAGE_KEY)
    let loadedPlans: Plan[] = []
    if (storedPlans) {
      try {
        const parsed = JSON.parse(storedPlans)
        loadedPlans = parsed.map((p: any) => ({
          ...p,
          permits: p.permits.map((perm: any) => ({
            ...perm,
            startDate: new Date(perm.startDate),
            endDate: new Date(perm.endDate)
          }))
        }))
        setPlans(loadedPlans)
      } catch (error) {
        console.error('Failed to load plans:', error)
      }
    }

    // 2. Load Current Permits (Legacy or current active)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const permitsWithDates = parsed.map((p: any) => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
          type: p.type || 'regular',
        }))
        setPermits(permitsWithDates)

        // Try to match current permits with a plan if not explicitly set
        if (loadedPlans.length > 0) {
          // For simplicity, we don't auto-select unless we have a specific reason
          // But let's check if the current permits exactly match a plan
          const matchingPlan = loadedPlans.find(p => JSON.stringify(p.permits) === JSON.stringify(permitsWithDates))
          if (matchingPlan) setCurrentPlanId(matchingPlan.id)
        }
      } catch (error) {
        console.error('Failed to load permits:', error)
      }
    }

    // 3. Load from URL if present
    const data = searchParams.get('data')
    if (data) {
      const sharedPermits = deserializePermits(data)
      if (sharedPermits.length > 0) {
        if (window.confirm(`检测到分享的 ${sharedPermits.length} 条排期数据，是否导入并作为新方案保存？`)) {
          const newPlanId = Date.now().toString()
          const newPlan: Plan = {
            id: newPlanId,
            name: '分享的方案',
            permits: sharedPermits
          }
          // Update plans and set as current
          const newPlans = [...loadedPlans, newPlan]
          updatePlans(newPlans, newPlanId)
          setPermits(sharedPermits)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sharedPermits))

          // Clear URL param
          searchParams.delete('data')
          setSearchParams(searchParams)
        }
      }
    }
  }, [])

  const handleSaveAsNewPlan = () => {
    // Auto-generate name instead of prompt
    const newPlanId = Date.now().toString()
    const name = `方案 ${plans.length + 1}`

    const newPlan: Plan = {
      id: newPlanId,
      name,
      permits: [...permits]
    }

    updatePlans([...plans, newPlan], newPlanId)
  }

  const handleSwitchPlan = (id: string) => {
    const plan = plans.find(p => p.id === id)
    if (plan) {
      // Ensure we create a new array to trigger re-renders
      const newPermits = [...plan.permits]
      setPermits(newPermits)
      setCurrentPlanId(id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPermits))
    }
  }

  const handleRemovePlan = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('确定要删除该方案吗？')) {
      const newPlans = plans.filter(p => p.id !== id)
      const newCurrentId = currentPlanId === id ? null : currentPlanId
      updatePlans(newPlans, newCurrentId)
    }
  }

  const handleClearPlanSelection = () => {
    setCurrentPlanId(null)
  }

  const handleShare = () => {
    if (permits.length === 0) {
      alert('请先添加排期再进行分享')
      return
    }

    const data = serializePermits(permits)
    const url = new URL(window.location.href)
    url.searchParams.set('data', data)

    // Copy to clipboard
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        alert('分享链接已复制到剪贴板')
      })
      .catch(err => {
        console.error('Failed to copy share link:', err)
        alert('复制链接失败，请手动复制浏览器地址栏')
      })
  }

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
      const dataUrl = await toJpeg(element, {
        cacheBust: true,
        quality: 0.9,
        width: config.width,
        height: config.height || element.scrollHeight || element.offsetHeight,
        style: {
          opacity: '1',
          zIndex: 'auto',
          visibility: 'visible',
          pointerEvents: 'auto'
        }
      })

      const link = document.createElement('a')
      link.download = `进京证排期_${exportDevice}_${currentYear}_${dayjs().format('YYYYMMDD')}.jpg`
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
          <button
            className="share-btn-header"
            onClick={handleShare}
            title="分享当前排期"
          >
            🔗 分享
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
            <div className="header-left">
              <h2>已排期列表</h2>
              <div className="plans-tabs">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    className={`plan-tab ${currentPlanId === plan.id ? 'active' : ''}`}
                    onClick={() => handleSwitchPlan(plan.id)}
                  >
                    <span className="plan-name">{plan.name}</span>
                    <button
                      className="remove-plan-btn"
                      onClick={(e) => handleRemovePlan(e, plan.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {currentPlanId && (
                  <button className="clear-selection-btn" onClick={handleClearPlanSelection} title="取消选择方案">
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="permits-actions">
              <button
                className="save-plan-btn" 
                onClick={handleSaveAsNewPlan}
              >
                保存为新方案
              </button>
              {permits.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="clear-all-btn"
                  title="清空所有排期"
                >
                  清空
                </button>
              )}
            </div>
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
                          <div className="title-left">
                            <strong>{year}</strong>
                            <span className="title-text"> 年排期计划</span>
                          </div>
                          <button
                            className="view-full-btn"
                            onClick={() => navigate(`/preview/${year}`, { state: { device: exportDevice } })}
                          >
                            查看完整排期
                          </button>
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

                                    // Gaps only appear before regular permits.
                                    // Measure from the end of the previous regular permit in the year.
                                    let gapNode = null;
                                    if (!isTemp) {
                                      const currentIdx = sortedYearPermits.findIndex(p => p.id === permit.id);
                                      let prevRegularPermit = null;
                                      let hasInterveningTemp = false;

                                      for (let i = currentIdx - 1; i >= 0; i--) {
                                        const p = sortedYearPermits[i];
                                        if (!p.type || p.type === 'regular') {
                                          prevRegularPermit = p;
                                          break;
                                        } else if (p.type === 'temporary') {
                                          hasInterveningTemp = true;
                                        }
                                      }

                                      if (prevRegularPermit) {
                                        gapNode = (
                                          <GapItem 
                                            prevEndDate={prevRegularPermit.endDate}
                                            currentStartDate={permit.startDate} 
                                            hasTemp={hasInterveningTemp}
                                          />
                                        );
                                      }
                                    }

                                    return (
                                      <>
                                        {gapNode}
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
      <Copyright className="page-footer" showTime={false} />
    </div>
  )
}

export default SchedulePage
