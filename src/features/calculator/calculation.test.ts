import { describe, expect, it } from 'vitest'
import { assumptions, calculateEstimate, type EstimateInput } from './calculation'
const input: EstimateInput = { province: 'Cavite', city: 'Imus', mode: 'bill', usage: 6000, rate: 12, system: 'grid-tied', battery: false, shading: 0 }
describe('preliminary solar calculation', () => {
  it('converts bills, rounds up panels, and calculates generation', () => {
    const r = calculateEstimate(input)
    expect(r.monthlyConsumption).toBe(500)
    expect(r.requiredKwp).toBeCloseTo(500 / (365 / 12) / 3.6)
    expect(r.panelCount).toBe(9)
    expect(r.installedKwp).toBeCloseTo(4.95)
    expect(r.dailyGeneration).toBeCloseTo(17.82)
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
})
