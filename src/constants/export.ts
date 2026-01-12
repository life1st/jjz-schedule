export type ExportDevice = 'desktop' | 'ipad' | 'iphone' | 'auto'

export interface DeviceConfig {
  width: number
  height?: number
  cols: number
  padding: number
  scale: number
}

export const DEVICE_CONFIGS: Record<ExportDevice, DeviceConfig> = {
  desktop: { width: 1920, height: 1080, cols: 6, padding: 30, scale: 0.8 },
  ipad: { width: 2360, height: 1640, cols: 6, padding: 50, scale: 1.15 },
  iphone: { width: 1170, height: undefined, cols: 1, padding: 40, scale: 1.1 },
  auto: { width: 1200, height: undefined, cols: 3, padding: 40, scale: 1 }
}
