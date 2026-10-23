import type { EstimateInput, EstimateResult } from './calculation'
import type { ApplianceEstimate } from './appliances'

export type QuoteEstimate =
  | { kind: 'usage'; input: EstimateInput; result: EstimateResult }
  | { kind: 'appliances'; result: ApplianceEstimate }
