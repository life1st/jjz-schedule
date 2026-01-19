import { ExportDevice } from '../constants/export'
import { ActionToolbar, ActionGroup, ActionItem } from './common/ActionButton'

interface PreviewToolbarProps {
  currentDevice: ExportDevice
  onDeviceChange: (device: ExportDevice) => void
  onFullscreen: () => void
}

export const PreviewToolbar = ({ currentDevice, onDeviceChange, onFullscreen }: PreviewToolbarProps) => {
  const devices: ExportDevice[] = ['auto', 'desktop', 'ipad', 'iphone']

  return (
    <div className="preview-toolbar-container">
      <ActionToolbar className="preview-toolbar">
        <ActionGroup>
          {devices.map(device => (
            <ActionItem
              key={device}
              label={device === 'auto' ? '自适应' : device.toUpperCase()}
              onClick={() => onDeviceChange(device)}
              active={currentDevice === device}
              title={device === 'auto' ? '自适应' : device.toUpperCase()}
            />
          ))}
        </ActionGroup>
        <ActionItem
          label={
            <>
              <span className="icon">⛶</span> 全屏
            </>
          }
          onClick={onFullscreen}
          title="全屏预览"
        />
      </ActionToolbar>
    </div>
  )
}
