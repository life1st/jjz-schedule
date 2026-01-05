export interface Permit {
  id: string
  startDate: Date
  endDate: Date
}

export interface PermitState {
  permits: Permit[]
}
