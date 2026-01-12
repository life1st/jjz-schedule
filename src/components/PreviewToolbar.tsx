import { ExportDevice } from '../constants/export'

interface PreviewToolbarProps {
  currentDevice: ExportDevice
  onDeviceChange: (device: ExportDevice) => void
  onFullscreen: () => void
}

export const PreviewToolbar = ({ currentDevice, onDeviceChange, onFullscreen }: PreviewToolbarProps) => {
  const devices: ExportDevice[] = ['auto', 'desktop', 'ipad', 'iphone']

  return (
    <div className="preview-toolbar">
      <div className="toolbar-group">
        {devices.map(device => (
          <button
            key={device}
            className={`toolbar-btn ${currentDevice === device ? 'active' : ''}`}
            onClick={() => onDeviceChange(device)}
            title={device === 'auto' ? '自适应' : device.toUpperCase()}
          >
            {device === 'auto' ? '自适应' : device.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onFullscreen} title="全屏预览">
          <span className="icon">⛶</span> 全屏
        </button>
      </div>
    </div>
  )
}
