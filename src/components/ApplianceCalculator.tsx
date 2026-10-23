import { useState } from 'react'
import { ArrowUpRight, Info, Minus, Plus, RotateCcw } from 'lucide-react'
import {
  applianceAssumptions,
  applianceSchema,
  calculateAppliances,
  sampleAppliances,
  usagePatterns,
  type ApplianceEstimate,
  type UsagePattern,
} from '../features/calculator/appliances'

type DraftRow = { id: string; name: string; watts: string; hours: string; quantity: number }
const initialRows = (): DraftRow[] => sampleAppliances.map(row => ({ ...row, watts: String(row.watts), hours: String(row.hours) }))
const number = (value: number, digits = 0) => new Intl.NumberFormat('en-PH', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)

export default function ApplianceCalculator({ onQuote }: { onQuote: (estimate: ApplianceEstimate) => void }) {
  const [rows, setRows] = useState(initialRows)
  const [pattern, setPattern] = useState<UsagePattern>('balanced')
  const update = (id: string, field: 'watts' | 'hours', value: string) => {
    setRows(current => current.map(row => row.id === id ? { ...row, [field]: value } : row))
  }
  const quantity = (id: string, delta: number) => {
    setRows(current => current.map(row => row.id === id ? { ...row, quantity: Math.max(0, Math.min(100, row.quantity + delta)) } : row))
  }
  const parsed = rows.map(row => ({
    ...row,
    watts: row.quantity === 0 ? Number(row.watts) || 1 : Number(row.watts),
    hours: row.quantity === 0 ? Number(row.hours) || 0 : row.hours.trim() === '' ? NaN : Number(row.hours),
  }))
  const invalidRows = parsed.flatMap((row, index) => applianceSchema.safeParse(row).success ? [] : [index])
  const result = invalidRows.length === 0 ? calculateAppliances(parsed, pattern) : null
  const hasEnergy = result !== null && result.dailyEnergy > 0
  const a = applianceAssumptions

  return <div className="appliance-layout">
    <a className="appliance-mobile-summary" href="#appliance-estimate" aria-label="View full appliance system estimate">
      <span><small>Solar</small><strong>{result ? `${number(result.solarKwp, 2)} kWp` : '—'}</strong></span>
      <span><small>Inverter</small><strong>{result ? `${number(result.inverterKw)} kW` : '—'}</strong></span>
      <span><small>Battery</small><strong>{result ? `${number(result.batteryKwh, 1)} kWh` : '—'}</strong></span>
      <ArrowUpRight size={17} />
    </a>
    <div className="appliance-editor">
      <div className="appliance-table-heading">
        <h3>Your appliances</h3>
        <p>Sample home shown. Change anything.</p>
      </div>
      <table className="appliance-table">
        <caption className="sr-only">Appliances, rated power, daily hours, and quantity. Changes update your estimate automatically.</caption>
        <thead><tr><th scope="col">Appliance</th><th scope="col">Watts</th><th scope="col">Hours / day</th><th scope="col">Qty</th></tr></thead>
        <tbody>{rows.map((row, index) => {
          const invalid = invalidRows.includes(index)
          return <tr key={row.id} className={row.quantity === 0 ? 'appliance-inactive' : ''}>
            <th scope="row">{row.name}</th>
            <td data-label="Watts"><div className="appliance-number"><input
              type="number" inputMode="decimal" min="1" max="50000" step="any"
              aria-label={`${row.name} watts`} aria-invalid={invalid || undefined}
              disabled={row.quantity === 0} value={row.watts}
              onChange={event => update(row.id, 'watts', event.target.value)}
            /><span aria-hidden="true">W</span></div></td>
            <td data-label="Hours / day"><input
              type="number" inputMode="decimal" min="0" max="24" step="any"
              aria-label={`${row.name} hours per day`} aria-invalid={invalid || undefined}
              disabled={row.quantity === 0} value={row.hours}
              onChange={event => update(row.id, 'hours', event.target.value)}
            /></td>
            <td data-label="Quantity"><div className="quantity-control">
              <button type="button" aria-label={`Decrease ${row.name} quantity`} disabled={row.quantity === 0} onClick={() => quantity(row.id, -1)}><Minus size={13} /></button>
              <output aria-label={`${row.name} quantity`}>{row.quantity}</output>
              <button type="button" aria-label={`Increase ${row.name} quantity`} disabled={row.quantity === 100} onClick={() => quantity(row.id, 1)}><Plus size={13} /></button>
            </div></td>
          </tr>
        })}</tbody>
      </table>
      {invalidRows.length > 0 && <p className="appliance-error" role="alert">Check {invalidRows.map(index => rows[index].name).join(', ')}: watts must be 1–50,000 and daily hours 0–24. Complete any empty fields.</p>}
      <fieldset className="usage-patterns">
        <legend>When do you use most of your power?</legend>
        <div className="usage-pattern-grid">{usagePatterns.map(option => <label key={option.id} className={pattern === option.id ? 'usage-pattern selected' : 'usage-pattern'}>
          <input type="radio" name="appliance-usage-pattern" value={option.id} checked={pattern === option.id} onChange={() => setPattern(option.id)} />
          <span><strong>{option.title}</strong><small>{option.description}</small></span>
        </label>)}</div>
      </fieldset>
      <div className="appliance-editor-footer"><p>Use your appliance labels for more accurate wattages. Sample duty hours and power ratings vary by model.</p><button type="button" onClick={() => { setRows(initialRows()); setPattern('balanced') }}><RotateCcw size={14} /> Reset sample</button></div>
    </div>

    <aside id="appliance-estimate" className="appliance-result" aria-label="Appliance system estimate">
      <span className="appliance-result-eyebrow"><span /> Estimated system</span>
      <div className="appliance-result-live" aria-live="polite" aria-atomic="true">
        <div className="appliance-headline-results">
          <div><span>Solar panels</span><strong>{result ? number(result.solarKwp, 2) : '—'}</strong><small>kWp</small></div>
          <div><span>Inverter</span><strong>{result ? number(result.inverterKw) : '—'}</strong><small>kW</small></div>
          <div><span>Battery</span><strong>{result ? number(result.batteryKwh, 1) : '—'}</strong><small>kWh nominal</small></div>
        </div>
        <dl className="appliance-details">
          <div><dt>Daily energy use</dt><dd>{result ? `${number(result.dailyEnergy, 1)} kWh` : '—'}</dd></div>
          <div><dt>Connected load</dt><dd>{result ? `${number(result.connectedLoad)} W` : '—'}</dd></div>
          <div><dt>{a.panelWatts} W panels</dt><dd>{result ? result.panelCount : '—'}</dd></div>
          <div><dt>Night energy to store</dt><dd>{result ? `${number(result.nightEnergy, 1)} kWh` : '—'}</dd></div>
          <div><dt>Est. monthly solar output</dt><dd>{result ? `${number(result.monthlyGeneration)} kWh` : '—'}</dd></div>
        </dl>
        {!hasEnergy && <p className="appliance-empty">{result ? 'Add an appliance with daily usage to see your system estimate.' : 'Complete the highlighted inputs to see an updated estimate.'}</p>}
      </div>
      <button className="button primary full" disabled={!hasEnergy} onClick={() => { if (result && hasEnergy) onQuote(result) }}>Request a quote with this estimate <ArrowUpRight size={16} /></button>
      <p className="appliance-assumption">Assumes {a.peakSunHours} peak sun hours and 20% system losses, nominal LiFePO4 batteries in {a.batteryModuleKwh} kWh steps, and an inverter sized for about 60% of connected load running at once. A rough guide only.</p>
      <details className="appliance-method"><summary>How this estimate works</summary><p>Daily use = watts × hours × quantity ÷ 1,000. Panels round up to {a.panelWatts} W modules. Monthly output assumes 30 days.</p><p>Nighttime shares are illustrative: 25% for mostly daytime, 50% for day and night, and 75% for mostly night. Battery figures are nominal capacity before usable-capacity limits, reserves, and conversion losses. They do not guarantee backup duration.</p><p>The inverter figure is a preliminary capacity allowance. A professional must verify simultaneous loads, motor starting surges, roof capacity, equipment compatibility, and local irradiation before design. No installation price or bill saving is implied.</p></details>
      <div className="appliance-planning-note"><Info size={15} /><span>Illustrative planning estimate. Final design follows a site and load assessment.</span></div>
    </aside>
  </div>
}
