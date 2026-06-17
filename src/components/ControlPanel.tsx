import React, { useState } from 'react'
import type { PlanInputs } from '../engine/types'
import { fmtFull, fmtPct } from '../utils/formatters'

interface Props {
  inputs: PlanInputs
  onChange: (inputs: PlanInputs) => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 0 6px',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {title}
        <span style={{ opacity: 0.5 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>}
    </div>
  )
}

function Field({
  label, value, min, max, step = 1, format, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number
  format: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
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

function NumberInput({
  label, value, onChange, prefix = '$',
}: {
  label: string; value: number; onChange: (v: number) => void; prefix?: string
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', fontSize: 12,
        }}>{prefix}</span>
        <input
          type="number" value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '7px 10px 7px 22px',
            fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>
    </div>
  )
}

export function ControlPanel({ inputs, onChange }: Props) {
  const set = <K extends keyof PlanInputs>(key: K, val: PlanInputs[K]) =>
    onChange({ ...inputs, [key]: val })

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px 16px',
      overflowY: 'auto', height: '100%',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.01em' }}>
        Assumptions
      </div>

      <Section title="Personal">
        <Field label="Current Age" value={inputs.currentAge} min={40} max={85} format={v => `${v}`}
          onChange={v => set('currentAge', v)} />
        <Field label="End Age" value={inputs.endAge} min={70} max={110} format={v => `${v}`}
          onChange={v => set('endAge', v)} />
      </Section>

      <Section title="Investment">
        <NumberInput label="Initial IRA Balance" value={inputs.initialBalance}
          onChange={v => set('initialBalance', v)} />
        <Field label="Annual Growth Rate" value={inputs.growthRate} min={0.01} max={0.15} step={0.005}
          format={fmtPct} onChange={v => set('growthRate', v)} />
        <Field label="Inflation Rate" value={inputs.inflationRate} min={0} max={0.08} step={0.005}
          format={fmtPct} onChange={v => set('inflationRate', v)} />
      </Section>

      <Section title="Tax">
        <Field label="Federal Tax Rate" value={inputs.federalTaxRate} min={0} max={0.55} step={0.01}
          format={fmtPct} onChange={v => set('federalTaxRate', v)} />
        <Field label="State Tax Rate" value={inputs.stateTaxRate} min={0} max={0.15} step={0.005}
          format={fmtPct} onChange={v => set('stateTaxRate', v)} />
        <Field label="Capital Gains Rate" value={inputs.capitalGainsRate} min={0} max={0.25} step={0.01}
          format={fmtPct} onChange={v => set('capitalGainsRate', v)} />
      </Section>

      <Section title="RMD Settings">
        <Field label="RMD Start Age" value={inputs.rmdStartAge} min={70} max={80} format={v => `${v}`}
          onChange={v => set('rmdStartAge', v)} />
      </Section>

      <Section title="Roth Conversion">
        <NumberInput label="Conversion Amount" value={inputs.conversionAmount}
          onChange={v => set('conversionAmount', v)} />
        <Field label="Conversion Age" value={inputs.conversionAge} min={inputs.currentAge} max={80}
          format={v => `${v}`} onChange={v => set('conversionAge', v)} />
      </Section>

      <div style={{
        marginTop: 20, padding: '12px 14px', background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <div>Combined tax rate: <strong style={{ color: 'var(--text-secondary)' }}>{fmtPct(Math.min(inputs.federalTaxRate + inputs.stateTaxRate, 0.85))}</strong></div>
          <div>Tax on conversion: <strong style={{ color: 'var(--orange-light)' }}>
            {fmtFull(inputs.conversionAmount * Math.min(inputs.federalTaxRate + inputs.stateTaxRate, 0.85))}
          </strong></div>
          <div>Roth (IRA net): <strong style={{ color: 'var(--orange-light)' }}>
            {fmtFull(inputs.conversionAmount * (1 - Math.min(inputs.federalTaxRate + inputs.stateTaxRate, 0.85)))}
          </strong></div>
        </div>
      </div>
    </div>
  )
}
