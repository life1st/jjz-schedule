export type PermitType = 'regular' | 'temporary'

export interface Permit {
  id: string
  startDate: Date
  endDate: Date
  type: PermitType
}

export interface Plan {
  id: string
  name: string
  permits: Permit[]
}

export interface PermitState {
  plans: Plan[]
  currentPlanId: string | null
}
