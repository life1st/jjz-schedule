import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { ExportCalendar } from '../components/ExportCalendar'
import { Permit } from '../types/permit'
import { ExportDevice } from '../constants/export'
import { loadPermitsFromStorage } from '../utils/shareUtils'
import { PreviewToolbar } from '../components/PreviewToolbar'
import { ActionToolbar, ActionItem } from '../components/common/ActionButton'
import './PreviewPage.scss'

const STORAGE_KEY = 'jjz-schedule-permits'

export default function PreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { year: yearParam } = useParams<{ year: string }>()
  const [permits, setPermits] = useState<Permit[]>([])
  const [exportDevice, setExportDevice] = useState<ExportDevice>('auto')
  const [year, setYear] = useState<number>(yearParam ? parseInt(yearParam, 10) : new Date().getFullYear())
  const [isEmpty, setIsEmpty] = useState<boolean>(false)

  useEffect(() => {
    // Load permits from localStorage
    const storedPermits = loadPermitsFromStorage(STORAGE_KEY)
    if (storedPermits.length > 0) {
      setPermits(storedPermits)
    } else {
      setIsEmpty(true)
    }

    // Load device from state if available
    if (location.state?.device) {
      setExportDevice(location.state.device)
    }

    // Update year if param changes
    if (yearParam) {
      setYear(parseInt(yearParam, 10))
    }
  }, [location.state, yearParam])

  const handleBack = () => {
    navigate('/schedule')
  }

  const handleFullscreen = () => {
    const previewElement = document.getElementById('preview-calendar')
    if (previewElement) {
      if (!document.fullscreenElement) {
        previewElement.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen mode: ${err.message}`)
        })
      } else {
        document.exitFullscreen()
      }
    }
  }

  return (
    <div className="preview-page" id="preview-container">
      <div className="back-btn-container">
        <ActionToolbar className="back-btn">
          <ActionItem
            label={
              <>
                <span className="icon">←</span> 返回规划
              </>
            }
            onClick={handleBack}
            title="返回规划页"
          />
        </ActionToolbar>
      </div>

      {permits.length ? (
        <>
          <ExportCalendar
            permits={permits}
            year={year}
            device={exportDevice}
            id="preview-calendar"
          />
          <PreviewToolbar
            currentDevice={exportDevice}
            onDeviceChange={setExportDevice}
            onFullscreen={handleFullscreen}
          />
        </>
      ) : null}

      {isEmpty && (
        <div className="preview-empty">
          <p>暂无排期数据，请返回添加</p>
          <button onClick={handleBack}>去添加</button>
        </div>
      )}
    </div>
  )
}
