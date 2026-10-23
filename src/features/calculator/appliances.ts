import { z } from 'zod'

export const applianceAssumptions = {
  peakSunHours: 4,
  performanceRatio: 0.8,
  panelWatts: 620,
  batteryModuleKwh: 5.1,
  simultaneousLoadRatio: 0.6,
  daysPerMonth: 30,
} as const

export const applianceSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  watts: z.number().min(1).max(50000),
  hours: z.number().min(0).max(24),
  quantity: z.number().int().min(0).max(100),
})
export type Appliance = z.infer<typeof applianceSchema>
export type UsagePattern = 'daytime' | 'balanced' | 'nighttime'
export const usagePatterns: { id: UsagePattern; title: string; description: string; nightShare: number }[] = [
  { id: 'daytime', title: 'Mostly daytime', description: 'Someone is home during the day. Light use at night.', nightShare: 0.25 },
  { id: 'balanced', title: 'Day and night', description: 'Aircon and appliances through the day, steady use at night.', nightShare: 0.5 },
  { id: 'nighttime', title: 'Mostly night', description: 'Out at work by day. Heavy use in the evening.', nightShare: 0.75 },
]

export const sampleAppliances: Appliance[] = [
  { id: 'aircon-inverter', name: 'Aircon 1.5 HP (inverter)', watts: 1000, hours: 8, quantity: 1 },
  { id: 'fridge', name: 'Refrigerator', watts: 150, hours: 12, quantity: 1 },
  { id: 'fan', name: 'Electric fan', watts: 60, hours: 8, quantity: 2 },
  { id: 'lights', name: 'LED lights', watts: 10, hours: 6, quantity: 8 },
  { id: 'tv', name: 'TV (LED)', watts: 100, hours: 5, quantity: 1 },
  { id: 'computer', name: 'Laptop or desktop', watts: 120, hours: 8, quantity: 1 },
  { id: 'router', name: 'Wi-Fi router', watts: 15, hours: 24, quantity: 1 },
  { id: 'rice', name: 'Rice cooker', watts: 700, hours: 1, quantity: 1 },
  { id: 'washer', name: 'Washing machine', watts: 500, hours: 1, quantity: 1 },
  { id: 'pump', name: 'Water pump 1 HP', watts: 750, hours: 0.5, quantity: 0 },
  { id: 'aircon', name: 'Aircon 1 HP', watts: 750, hours: 8, quantity: 0 },
  { id: 'heater', name: 'Electric water heater', watts: 3500, hours: 0.3, quantity: 0 },
  { id: 'microwave', name: 'Microwave', watts: 1200, hours: 0.3, quantity: 0 },
  { id: 'induction', name: 'Induction cooker', watts: 2000, hours: 1, quantity: 0 },
]

export function calculateAppliances(raw: Appliance[], pattern: UsagePattern) {
  const appliances = z.array(applianceSchema).parse(raw)
  const selectedPattern = usagePatterns.find(option => option.id === pattern)
  if (!selectedPattern) throw new Error('Choose a supported usage pattern')
  const a = applianceAssumptions
  const dailyEnergy = appliances.reduce((total, row) => total + row.watts * row.hours * row.quantity / 1000, 0)
  const connectedLoad = appliances.reduce((total, row) => total + row.watts * row.quantity, 0)
  const panelCount = Math.ceil(dailyEnergy / (a.peakSunHours * a.performanceRatio) * 1000 / a.panelWatts)
  const solarKwp = panelCount * a.panelWatts / 1000
  const nightEnergy = dailyEnergy * selectedPattern.nightShare
  const batteryModules = Math.ceil(nightEnergy / a.batteryModuleKwh)
  const batteryKwh = batteryModules * a.batteryModuleKwh
  const inverterTarget = connectedLoad * a.simultaneousLoadRatio / 1000
  const inverterSizes = [3, 5, 6, 8, 10, 12, 15, 20, 30, 50, 75, 100]
  const inverterKw = dailyEnergy === 0 ? 0 : inverterSizes.find(size => size >= inverterTarget) ?? Math.ceil(inverterTarget)
  const monthlyGeneration = solarKwp * a.peakSunHours * a.performanceRatio * a.daysPerMonth
  return { appliances: appliances.map(row => ({ ...row })), pattern, dailyEnergy, connectedLoad, panelCount, solarKwp, nightEnergy, batteryModules, batteryKwh, inverterKw, monthlyGeneration }
}
export type ApplianceEstimate = ReturnType<typeof calculateAppliances>
