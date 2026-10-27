import { describe, expect, it } from 'vitest'
import { calculateAppliances, sampleAppliances } from './appliances'

// Reference sample from the original estimator: cooking appliances switched off.
const referenceAppliances = sampleAppliances.map(row => ['microwave', 'oven', 'induction', 'kettle'].includes(row.id) ? { ...row, quantity: 0 } : row)

describe('appliance-based planning estimate', () => {
  it('reproduces the reference sample using explicit assumptions', () => {
    const r = calculateAppliances(referenceAppliances, 'balanced')
    expect(r.dailyEnergy).toBeCloseTo(14.26)
    expect(r.connectedLoad).toBe(2785)
    expect(r.panelCount).toBe(8)
    expect(r.solarKwp).toBeCloseTo(4.96)
    expect(r.inverterKw).toBe(3)
    expect(r.nightEnergy).toBeCloseTo(7.13)
    expect(r.batteryKwh).toBeCloseTo(10.2)
    expect(r.monthlyGeneration).toBeCloseTo(476.16)
  })
  it('recalculates when an appliance quantity changes', () => {
    const rows = referenceAppliances.map(row => row.id === 'aircon-inverter' ? { ...row, quantity: 3 } : row)
    const r = calculateAppliances(rows, 'balanced')
    expect(r.dailyEnergy).toBeCloseTo(30.26)
    expect(r.connectedLoad).toBe(4785)
    expect(r.solarKwp).toBeCloseTo(9.92)
    expect(r.batteryKwh).toBeCloseTo(15.3)
  })
  it('changes battery sizing with usage timing without changing daily demand', () => {
    const day = calculateAppliances(sampleAppliances, 'daytime')
    const night = calculateAppliances(sampleAppliances, 'nighttime')
    expect(night.dailyEnergy).toBe(day.dailyEnergy)
    expect(night.nightEnergy).toBeCloseTo(day.nightEnergy * 3)
    expect(night.batteryKwh).toBeGreaterThan(day.batteryKwh)
  })
  it('returns zero sizing when no appliances consume energy', () => {
    const r = calculateAppliances(sampleAppliances.map(row => ({ ...row, quantity: 0 })), 'balanced')
    expect([r.dailyEnergy, r.connectedLoad, r.solarKwp, r.batteryKwh, r.inverterKw]).toEqual([0, 0, 0, 0, 0])
    expect(calculateAppliances([{ ...sampleAppliances[0], hours: 0 }], 'balanced').solarKwp).toBe(0)
  })
  it('rejects invalid values instead of calculating misleading output', () => {
    for (const patch of [{ hours: 25 }, { hours: -1 }, { watts: 0 }, { watts: NaN }, { quantity: -1 }, { quantity: 1.5 }, { hours: Infinity }]) {
      expect(() => calculateAppliances([{ ...sampleAppliances[0], ...patch }], 'balanced')).toThrow()
    }
  })
  it('keeps quote snapshots independent of later form edits', () => {
    const rows = sampleAppliances.map(row => ({ ...row }))
    const result = calculateAppliances(rows, 'balanced')
    rows[0].quantity = 20
    expect(result.appliances[0].quantity).toBe(1)
  })
})
