export type ExportDevice = 'desktop' | 'ipad' | 'iphone' | 'auto'

export interface DeviceConfig {
  width: number
  height?: number
  cols: number
  padding: string
  scale: number
}

export const DEVICE_CONFIGS: Record<ExportDevice, DeviceConfig> = {
  desktop: { width: 3840, height: 2160, cols: 4, padding: '150px', scale: 1.65 },
  ipad: { width: 2048, height: 1536, cols: 3, padding: '50px', scale: 1.2 },
  iphone: { width: 1170, height: undefined, cols: 1, padding: '40px', scale: 1.1 },
  auto: { width: 1200, height: undefined, cols: 3, padding: '40px', scale: 1 }
}
