import { describe, expect, it } from 'vitest'
import { assumptions, calculateEstimate, type EstimateInput } from './calculation'
const input: EstimateInput = { province: 'Cavite', city: 'Imus', mode: 'bill', usage: 6000, rate: 12, system: 'grid-tied', battery: false, shading: 0 }
describe('preliminary solar calculation', () => {
  it('converts bills, rounds up panels, and calculates generation', () => {
    const r = calculateEstimate(input)
    expect(r.monthlyConsumption).toBe(500)
    expect(r.requiredKwp).toBeCloseTo(500 / (365 / 12) / 3.6)
    expect(r.panelCount).toBe(8)
    expect(r.installedKwp).toBeCloseTo(4.96)
    expect(r.dailyGeneration).toBeCloseTo(17.856)
    expect(r.annualGeneration).toBeCloseTo(r.dailyGeneration * 365)
    expect(r.monthlyGeneration).toBeCloseTo(r.dailyGeneration * 365 / 12)
  })
  it('only values self-consumed energy at retail rate', () => {
    const r = calculateEstimate(input)
    expect(r.selfConsumed).toBeCloseTo(r.monthlyGeneration * assumptions.selfConsumptionRatio)
    expect(r.monthlySavings).toBeCloseTo(r.selfConsumed * 12)
    expect(r.annualSavings).toBeCloseTo(r.monthlySavings * 12)
    expect(r.exportedEnergy).toBeGreaterThan(0)
  })
  it('supports direct consumption and caps savings at demand', () => {
    const r = calculateEstimate({ ...input, mode: 'consumption', usage: 1 })
    expect(r.monthlyConsumption).toBe(1)
    expect(r.monthlySavings).toBeLessThanOrEqual(12)
  })
  it('limits panels to available roof area including zero-panel roofs', () => {
    expect(calculateEstimate({ ...input, roofArea: 10 }).panelCount).toBe(3)
    const r = calculateEstimate({ ...input, roofArea: 1 })
    expect(r.panelCount).toBe(0)
    expect(r.monthlySavings).toBe(0)
    expect(r.roofLimited).toBe(true)
  })
  it('applies additional shading once', () => {
    const r = calculateEstimate({ ...input, shading: 20 })
    expect(r.performanceRatio).toBeCloseTo(0.64)
  })
  it('rejects zero, invalid, negative, and nonfinite values', () => {
    for (const patch of [{ rate: 0 }, { usage: 0 }, { usage: -1 }, { rate: NaN }, { roofArea: 0 }, { shading: 100 }, { usage: Infinity }]) {
      expect(() => calculateEstimate({ ...input, ...patch })).toThrow()
    }
  })
  it('sizes a hybrid inverter and battery from the bill like the sizing sheet', () => {
    const r = calculateEstimate({ ...input, mode: 'consumption', usage: 500, system: 'hybrid', battery: true, usagePattern: 'balanced', aircons: 1 })
    expect(r.peakLoadKw).toBeCloseTo(2 + 500 / (365 / 12) * 0.1 + 1.125 * 0.85)
    expect(r.inverterKw).toBe(6)
    expect(r.batteryRequiredKwh).toBeCloseTo(500 / (365 / 12) * 0.5 / (0.95 * 0.9))
    expect(r.batteryKwh).toBeCloseTo(10.24)
  })
  it('shows no inverter or battery for grid-tied, and no battery when unticked', () => {
    expect(calculateEstimate(input).inverterKw).toBe(0)
    expect(calculateEstimate(input).batteryKwh).toBe(0)
    const noBattery = calculateEstimate({ ...input, system: 'hybrid', battery: false })
    expect(noBattery.inverterKw).toBeGreaterThan(0)
    expect(noBattery.batteryKwh).toBe(0)
  })
  it('gives a bigger inverter for more aircons', () => {
    const base = { ...input, mode: 'consumption' as const, usage: 500, system: 'hybrid' as const, battery: true }
    expect(calculateEstimate({ ...base, aircons: 0 }).inverterKw).toBe(5)
    expect(calculateEstimate({ ...base, aircons: 1 }).inverterKw).toBe(6)
    expect(calculateEstimate({ ...base, aircons: 3 }).inverterKw).toBe(8)
  })
})
