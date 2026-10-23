import { z } from 'zod'

export const assumptions = {
  daysPerMonth: 365 / 12,
  peakSunHours: 4.5,
  performanceRatio: 0.8,
  panelWatts: 550,
  panelArea: 2.6,
  selfConsumptionRatio: 0.7,
  defaultRate: 12,
} as const

export const estimateSchema = z.object({
  province: z.string().trim().min(2, 'Enter your province'),
  city: z.string().trim().min(2, 'Enter your city or municipality'),
  mode: z.enum(['bill', 'consumption']),
  usage: z.number().positive('Enter a value greater than zero').max(10000000, 'Please enter a smaller value'),
  rate: z.number().positive('Rate must be greater than zero').max(100, 'Check your electricity rate'),
  system: z.enum(['grid-tied', 'hybrid']),
  battery: z.boolean(),
  roofArea: z.number().positive('Enter a roof area greater than zero').optional(),
  shading: z.number().min(0).max(90),
})
export type EstimateInput = z.infer<typeof estimateSchema>
export type EstimateResult = ReturnType<typeof calculateEstimate>

export function calculateEstimate(raw: EstimateInput) {
  const input = estimateSchema.parse(raw)
  const a = assumptions
  const monthlyConsumption = input.mode === 'bill' ? input.usage / input.rate : input.usage
  const performanceRatio = a.performanceRatio * (1 - input.shading / 100)
  const requiredKwp = monthlyConsumption / a.daysPerMonth / (a.peakSunHours * performanceRatio)
  const requiredPanels = Math.ceil(requiredKwp * 1000 / a.panelWatts)
  const roofCapacity = input.roofArea === undefined ? undefined : Math.floor(input.roofArea / a.panelArea)
  const panelCount = Math.min(requiredPanels, roofCapacity ?? requiredPanels)
  const installedKwp = panelCount * a.panelWatts / 1000
  const dailyGeneration = installedKwp * a.peakSunHours * performanceRatio
  const monthlyGeneration = dailyGeneration * a.daysPerMonth
  const annualGeneration = dailyGeneration * 365
  const selfConsumed = Math.min(monthlyConsumption, monthlyGeneration * a.selfConsumptionRatio)
  const monthlySavings = selfConsumed * input.rate
  return { monthlyConsumption, requiredKwp, requiredPanels, panelCount, installedKwp, dailyGeneration, monthlyGeneration, annualGeneration, selfConsumed, monthlySavings, annualSavings: monthlySavings * 12, exportedEnergy: Math.max(0, monthlyGeneration - selfConsumed), roofLimited: panelCount < requiredPanels, roofAreaNeeded: panelCount * a.panelArea, performanceRatio }
}
