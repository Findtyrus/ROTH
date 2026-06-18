import React from 'react'
import type { ProjectionResults } from '../engine/types'
import { fmt, fmtFull } from '../utils/formatters'
import { effectiveTaxRate } from '../engine/calculator'

interface Props {
  results: ProjectionResults
}

interface CardProps {
  label: string
  value: string
  sub?: string
  detail?: string
  accentColor: string
  recommended?: boolean
}

function StrategyCard({ label, value, sub, detail, accentColor, recommended }: CardProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${recommended ? accentColor : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      position: 'relative',
      boxShadow: recommended ? `0 0 0 1px ${accentColor}20, var(--shadow-card)` : 'var(--shadow-card)',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accentColor, borderRadius: '18px 18px 0 0',
      }} />
      {recommended && (
        <div style={{
          position: 'absolute', top: 10, right: 14,
          background: accentColor, color: '#fff',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', padding: '2px 7px', borderRadius: 10,
        }}>
          Best
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</div>
      )}
      {detail && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{detail}</div>
      )}
    </div>
  )
}

export function KPICards({ results }: Props) {
  const { traditional, rothFromIRA, rothFromCash, breakevenB, breakevenC, inputs } = results
  const lastTrad = traditional[traditional.length - 1]
  const lastRothB = rothFromIRA[rothFromIRA.length - 1]
  const lastRothC = rothFromCash[rothFromCash.length - 1]
  const taxRate = effectiveTaxRate(inputs)

  const bestFinal = Math.max(lastTrad.afterTaxWealth, lastRothB.afterTaxWealth, lastRothC.afterTaxWealth)
  const bestIsC = lastRothC.afterTaxWealth === bestFinal
  const bestIsB = !bestIsC && lastRothB.afterTaxWealth === bestFinal

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
      <StrategyCard
        label="Traditional IRA"
        value={fmt(lastTrad.afterTaxWealth)}
        sub={`After-tax wealth at age ${inputs.endAge}`}
        detail={`${fmtFull(lastTrad.cumulativeTaxes)} total taxes paid`}
        accentColor="var(--blue)"
        recommended={!bestIsC && !bestIsB}
      />
      <StrategyCard
        label="Roth — Tax from IRA"
        value={fmt(lastRothB.afterTaxWealth)}
        sub={breakevenB ? `Breakeven at age ${breakevenB}` : 'No breakeven in range'}
        detail={`${fmtFull(lastRothB.cumulativeTaxesPaid)} total taxes paid`}
        accentColor="var(--orange)"
        recommended={bestIsB}
      />
      <StrategyCard
        label="Roth — Tax from Cash"
        value={fmt(lastRothC.afterTaxWealth)}
        sub={breakevenC ? `Breakeven at age ${breakevenC}` : 'No breakeven in range'}
        detail={`Gross ${fmt(lastRothC.afterTaxWealthGross)} · Cash tax ${fmtFull(Math.min(inputs.conversionAmount, inputs.initialBalance) * taxRate)}`}
        accentColor="var(--green)"
        recommended={bestIsC}
      />
    </div>
  )
}
