import { ExportDevice } from '../constants/export'
import { ActionButton, ActionItem } from './common/ActionButton'

interface PreviewToolbarProps {
  currentDevice: ExportDevice
  onDeviceChange: (device: ExportDevice) => void
  onFullscreen: () => void
}

export const PreviewToolbar = ({ currentDevice, onDeviceChange, onFullscreen }: PreviewToolbarProps) => {
  const devices: ExportDevice[] = ['auto', 'desktop', 'ipad', 'iphone']

  const deviceActions: ActionItem[] = devices.map(device => ({
    label: device === 'auto' ? '自适应' : device.toUpperCase(),
    onClick: () => onDeviceChange(device),
    active: currentDevice === device,
    title: device === 'auto' ? '自适应' : device.toUpperCase()
  }))

  const fullscreenAction: ActionItem = {
    label: (
      <>
        <span className="icon">⛶</span> 全屏
      </>
    ),
    onClick: onFullscreen,
    title: '全屏预览'
  }

  return (
    <div className="preview-toolbar-container">
      <ActionButton actions={[deviceActions, [fullscreenAction]]} className="preview-toolbar" />
    </div>
  )
}
