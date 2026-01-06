export type PermitType = 'regular' | 'temporary'

export interface Permit {
  id: string
  startDate: Date
  endDate: Date
  type: PermitType
}

export interface PermitState {
  permits: Permit[]
}
