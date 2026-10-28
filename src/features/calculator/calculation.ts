import { z } from 'zod'
import { applianceAssumptions, usagePatterns } from './appliances'

export const assumptions = {
  daysPerMonth: 365 / 12,
  peakSunHours: 4.5,
  performanceRatio: 0.8,
  panelWatts: 620,
  panelArea: 2.7,
  selfConsumptionRatio: 0.7,
  defaultRate: 12,
} as const

// Hybrid sizing from a bill, aligned with the PV System Sizing sheet.
export const hybridAssumptions = {
  householdBaseKw: 2, // fridge, lights, fans and some cooking running at the busiest hour
  householdKwPerDailyKwh: 0.1, // extra busiest-hour load per kWh used per day
  airconRunningKw: 1.125, // 1.5 HP aircon running load, from the sheet's Index
  firstAirconFactor: 0.85, // first aircon cooling a room down (sheet's peak-use factor)
  extraAirconFactor: 0.5, // other aircons running steady (sheet's steady factor)
  safetyMargin: 0.15, // inverter continuous rating must cover busiest-hour load + 15%
  airconSurgeKw: 2.25, // extra startup power of one 1.5 HP aircon
  inverterPeakMultiplier: 2, // Solis hybrid peak = 2x rating for 10 s
  maxPvToInverterRatio: 1.3, // solar array may be up to 1.3x the inverter size
  inverterSizesKw: [5, 6, 8, 10, 12, 16], // Solis single-phase hybrid (L-PLUS / YD-L) on the IAN Solar April 2026 price list
  roundTripEfficiency: applianceAssumptions.roundTripEfficiency,
  depthOfDischarge: applianceAssumptions.depthOfDischarge,
  batteryModuleKwh: applianceAssumptions.batteryModuleKwh,
} as const

export const estimateSchema = z.object({
  // Location fields are hidden on the page for now, so they are not required.
  province: z.string().trim(),
  city: z.string().trim(),
  mode: z.enum(['bill', 'consumption']),
  usage: z.number().positive('Enter a value greater than zero').max(10000000, 'Please enter a smaller value'),
  rate: z.number().positive('Rate must be greater than zero').max(100, 'Check your electricity rate'),
  system: z.enum(['grid-tied', 'hybrid']),
  battery: z.boolean(),
  roofArea: z.number().positive('Enter a roof area greater than zero').optional(),
  shading: z.number().min(0).max(90),
  usagePattern: z.enum(['daytime', 'balanced', 'nighttime']).optional(),
  aircons: z.number().int().min(0).max(10).optional(),
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
  // Hybrid only: inverter and battery estimates
  const h = hybridAssumptions
  const isHybrid = input.system === 'hybrid'
  const dailyUse = monthlyConsumption / a.daysPerMonth
  const aircons = input.aircons ?? 1
  // Busiest-hour load = household base + first aircon cooling down + other aircons running steady
  const airconLoadKw = aircons === 0 ? 0 : h.airconRunningKw * (h.firstAirconFactor + (aircons - 1) * h.extraAirconFactor)
  const peakLoadKw = h.householdBaseKw + dailyUse * h.householdKwPerDailyKwh + airconLoadKw
  const requiredContinuousKw = peakLoadKw * (1 + h.safetyMargin)
  const requiredPeakKw = peakLoadKw + (aircons > 0 ? h.airconSurgeKw : 0)
  const minForPvKw = installedKwp / h.maxPvToInverterRatio
  const inverterKw = !isHybrid ? 0 : h.inverterSizesKw.find(size => size >= requiredContinuousKw && size * h.inverterPeakMultiplier >= requiredPeakKw && size >= minForPvKw) ?? Math.ceil(Math.max(requiredContinuousKw, minForPvKw))
  const nightShare = usagePatterns.find(option => option.id === (input.usagePattern ?? 'daytime'))?.nightShare ?? 0.35
  const nightEnergy = isHybrid && input.battery ? dailyUse * nightShare : 0
  const batteryRequiredKwh = nightEnergy / (h.roundTripEfficiency * h.depthOfDischarge)
  const batteryModules = Math.ceil(batteryRequiredKwh / h.batteryModuleKwh)
  const batteryKwh = batteryModules * h.batteryModuleKwh
  return { dailyUse, peakLoadKw, requiredContinuousKw, requiredPeakKw, inverterKw, nightEnergy, batteryRequiredKwh, batteryModules, batteryKwh, monthlyConsumption, requiredKwp, requiredPanels, panelCount, installedKwp, dailyGeneration, monthlyGeneration, annualGeneration, selfConsumed, monthlySavings, annualSavings: monthlySavings * 12, exportedEnergy: Math.max(0, monthlyGeneration - selfConsumed), roofLimited: panelCount < requiredPanels, roofAreaNeeded: panelCount * a.panelArea, performanceRatio }
}
