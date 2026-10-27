import { describe, expect, it } from 'vitest'
import { calculateAppliances, sampleAppliances, type Appliance } from './appliances'

// Fixed reference sample from the original estimator. Kept separate from the
// on-screen sample list so editing that list never breaks these math checks.
const referenceAppliances: Appliance[] = [
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
]

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
