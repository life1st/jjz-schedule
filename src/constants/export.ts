export type ExportDevice = 'desktop' | 'ipad' | 'iphone' | 'auto'

export interface DeviceConfig {
  width: number
  height?: number
  cols: number
  padding: string
  scale: number
}

export const DEVICE_CONFIGS: Record<ExportDevice, DeviceConfig> = {
  desktop: { width: 3840, height: 2160, cols: 4, padding: '200px', scale: 1.8 },
  ipad: { width: 1536, height: 2048, cols: 3, padding: '50px', scale: 1.2 },
  iphone: { width: 1170, height: 2532, cols: 2, padding: '40px', scale: 1.1 },
  auto: { width: 1200, height: undefined, cols: 3, padding: '40px', scale: 1 }
}
