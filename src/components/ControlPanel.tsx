import React, { useState } from 'react'
import type { PlanInputs, DistributionInputs } from '../engine/types'
import type { FilingStatus } from '../engine/taxBrackets'
import { calculateConversionTax } from '../engine/taxBrackets'
import { fmtFull, fmtPct } from '../utils/formatters'
import { effectiveTaxRate } from '../engine/calculator'

const FILING_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: 'married_joint', label: 'Married Filing Jointly' },
  { value: 'single', label: 'Single' },
  { value: 'married_separate', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
]

interface Props {
  inputs: PlanInputs
  onChange: (inputs: PlanInputs) => void
  distInputs: DistributionInputs
  onDistChange: (d: DistributionInputs) => void
  filingStatus: FilingStatus
  onFilingStatusChange: (s: FilingStatus) => void
  existingIncome: number
  onExistingIncomeChange: (n: number) => void
}

function Section({ title, children, defaultOpen = true }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          color: 'var(--text-muted)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 0 6px',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', borderBottom: '1px solid var(--border)',
        }}
      >
        {title}
        <span style={{ fontSize: 12, opacity: 0.5, letterSpacing: 0, textTransform: 'none', fontWeight: 400 }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function SliderField({
  label, value, min, max, step = 1, format, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number
  format: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
        }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  )
}

function NumberField({
  label, value, onChange, prefix = '$',
}: {
  label: string; value: number; onChange: (v: number) => void; prefix?: string
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6,
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: 12, pointerEvents: 'none',
          }}>
            {prefix}
          </span>
        )}
        <input
          type="number" value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: '100%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            padding: prefix ? '8px 10px 8px 22px' : '8px 10px',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>
    </div>
  )
}

export function ControlPanel({ inputs, onChange, distInputs, onDistChange, filingStatus, onFilingStatusChange, existingIncome, onExistingIncomeChange }: Props) {
  const set = <K extends keyof PlanInputs>(key: K, val: PlanInputs[K]) =>
    onChange({ ...inputs, [key]: val })
  const setDist = <K extends keyof DistributionInputs>(key: K, val: DistributionInputs[K]) =>
    onDistChange({ ...distInputs, [key]: val })

  const taxRate = effectiveTaxRate(inputs)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
        marginBottom: 20, letterSpacing: '-0.01em',
      }}>
        Assumptions
      </div>

      <Section title="Personal">
        <SliderField
          label="Current Age" value={inputs.currentAge} min={40} max={85}
          format={v => `${v}`} onChange={v => set('currentAge', v)}
        />
        <SliderField
          label="End Age" value={inputs.endAge} min={70} max={110}
          format={v => `${v}`} onChange={v => set('endAge', v)}
        />
      </Section>

      <Section title="Portfolio">
        <NumberField
          label="Traditional IRA Balance"
          value={inputs.initialBalance}
          onChange={v => set('initialBalance', v)}
        />
        <SliderField
          label="Annual Growth Rate" value={inputs.growthRate} min={0.01} max={0.15} step={0.005}
          format={fmtPct} onChange={v => set('growthRate', v)}
        />
      </Section>

      <Section title="Taxes">
        <SliderField
          label="Federal Tax Rate" value={inputs.federalTaxRate} min={0} max={0.55} step={0.01}
          format={fmtPct} onChange={v => set('federalTaxRate', v)}
        />
        <SliderField
          label="State Tax Rate" value={inputs.stateTaxRate} min={0} max={0.15} step={0.005}
          format={fmtPct} onChange={v => set('stateTaxRate', v)}
        />
      </Section>

      <Section title="Roth Conversion">
        <NumberField
          label="Conversion Amount"
          value={inputs.conversionAmount}
          onChange={v => set('conversionAmount', v)}
        />
        <SliderField
          label="Conversion Age" value={inputs.conversionAge}
          min={inputs.currentAge} max={80}
          format={v => `${v}`} onChange={v => set('conversionAge', v)}
        />
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text-muted)',
          lineHeight: 1.8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Combined tax rate</span>
            <strong style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {fmtPct(taxRate)}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax due on conversion</span>
            <strong style={{ color: 'var(--orange)', fontFamily: 'var(--font-mono)' }}>
              {fmtFull(Math.min(inputs.conversionAmount, inputs.initialBalance) * taxRate)}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Roth B starting balance</span>
            <strong style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {fmtFull(Math.min(inputs.conversionAmount, inputs.initialBalance) * (1 - taxRate))}
            </strong>
          </div>
        </div>
      </Section>

      <Section title="RMD Settings">
        <SliderField
          label="RMD Start Age" value={inputs.rmdStartAge} min={70} max={80}
          format={v => `${v}`} onChange={v => set('rmdStartAge', v)}
        />
      </Section>

      <Section title="Tax Bracket Calculator" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Filing Status
            </label>
            <select
              value={filingStatus}
              onChange={e => onFilingStatusChange(e.target.value as FilingStatus)}
              style={{
                width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '8px 10px',
                fontSize: 12, outline: 'none', cursor: 'pointer',
              }}
            >
              {FILING_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <NumberField
            label="Existing Taxable Income"
            value={existingIncome}
            onChange={onExistingIncomeChange}
          />
          {(() => {
            const r = calculateConversionTax(existingIncome, inputs.conversionAmount, filingStatus, inputs.stateTaxRate)
            const flatEstimate = inputs.conversionAmount * effectiveTaxRate(inputs)
            const savings = flatEstimate - r.totalTaxOnConversion
            return (
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bracket before conversion</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fmtPct(r.bracketBeforeConversion)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bracket after conversion</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: r.pushedIntoHigherBracket ? 'var(--orange)' : 'var(--text-secondary)' }}>{fmtPct(r.bracketAfterConversion)}</strong>
                </div>
                {r.pushedIntoHigherBracket && (
                  <div style={{ fontSize: 10, color: 'var(--orange)', background: 'rgba(255,149,0,0.08)', borderRadius: 6, padding: '4px 8px', marginTop: 2 }}>
                    Conversion enters a higher bracket
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Federal tax on conversion</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fmtFull(r.federalTaxOnConversion)}</strong>
                  </div>
                  {inputs.stateTaxRate > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: 'var(--text-muted)' }}>State tax ({fmtPct(inputs.stateTaxRate)})</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fmtFull(r.stateTaxOnConversion)}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total tax due</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--orange)' }}>{fmtFull(r.totalTaxOnConversion)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Effective rate</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fmtPct(r.effectiveRateOnConversion)}</strong>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Flat-rate estimate ({fmtPct(effectiveTaxRate(inputs))})</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{fmtFull(flatEstimate)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Graduated vs. flat</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: savings > 0 ? 'var(--green)' : 'var(--red, #ff3b30)' }}>
                      {savings >= 0 ? '−' : '+'}{fmtFull(Math.abs(savings))}
                    </strong>
                  </div>
                </div>
                {r.bracketBreakdown.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Bracket Breakdown</div>
                    {r.bracketBreakdown.map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                        <span>{fmtPct(b.rate)} × {fmtFull(b.amountInBracket)}</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtFull(b.taxInBracket)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                  Informational only — main projections use the flat tax rate above.
                </div>
              </div>
            )
          })()}
        </div>
      </Section>

      <Section title="Monthly Withdrawals">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Enable Withdrawals</span>
          <button
            onClick={() => setDist('enabled', !distInputs.enabled)}
            style={{
              width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
              background: distInputs.enabled ? 'var(--blue)' : 'var(--border)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: distInputs.enabled ? 20 : 3,
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
        {distInputs.enabled && (
          <>
            <NumberField
              label="Monthly Withdrawal"
              value={distInputs.monthlyDistribution}
              onChange={v => setDist('monthlyDistribution', v)}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8 }}>
              Annual: <strong style={{ color: 'var(--green-light)', fontFamily: 'var(--font-mono)' }}>
                {fmtFull(distInputs.monthlyDistribution * 12)}
              </strong>
            </div>
            <SliderField
              label="Annual Increase (COLA)"
              value={distInputs.distributionIncreaseRate}
              min={0} max={0.08} step={0.005}
              format={fmtPct}
              onChange={v => setDist('distributionIncreaseRate', v)}
            />
            <SliderField
              label="Start Age"
              value={distInputs.distributionStartAge}
              min={inputs.currentAge} max={inputs.endAge}
              format={v => `${v}`}
              onChange={v => setDist('distributionStartAge', v)}
            />
          </>
        )}
      </Section>
    </div>
  )
}
