export type ExportDevice = 'desktop' | 'ipad' | 'iphone' | 'auto'

export interface DeviceConfig {
  width: number
  height?: number
  cols: number
  padding: string
  scale: number
}

export const DEVICE_CONFIGS: Record<ExportDevice, DeviceConfig> = {
  desktop: { width: 2560, height: 1440, cols: 6, padding: '60px', scale: 1.2 },
  ipad: { width: 2360, height: 1640, cols: 6, padding: '50px', scale: 1.15 },
  iphone: { width: 1170, height: undefined, cols: 1, padding: '40px', scale: 1.1 },
  auto: { width: 1200, height: undefined, cols: 3, padding: '40px', scale: 1 }
}
