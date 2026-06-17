import React from 'react'
import type { ProjectionResults } from '../engine/types'
import { fmt, fmtFull } from '../utils/formatters'

interface Props {
  results: ProjectionResults
}

interface KPICardProps {
  label: string
  value: string
  sub?: string
  color: 'blue' | 'orange' | 'green' | 'purple'
  accent?: string
}

function KPICard({ label, value, sub, color, accent }: KPICardProps) {
  const colorMap = {
    blue: { bg: 'var(--blue-dim)', border: 'var(--blue)', text: 'var(--blue-light)' },
    orange: { bg: 'var(--orange-dim)', border: 'var(--orange)', text: 'var(--orange-light)' },
    green: { bg: 'var(--green-dim)', border: 'var(--green)', text: 'var(--green-light)' },
    purple: { bg: 'rgba(139,92,246,0.15)', border: 'var(--purple)', text: '#a78bfa' },
  }
  const c = colorMap[color]

  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: c.border, opacity: 0.6,
      }} />
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: c.text, lineHeight: 1.1, fontFamily: 'var(--font-mono)' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          {sub}
        </div>
      )}
      {accent && (
        <div style={{ fontSize: 11, color: c.text, marginTop: 2, fontWeight: 500 }}>
          {accent}
        </div>
      )}
    </div>
  )
}

export function KPICards({ results }: Props) {
  const { traditional, rothFromIRA, rothFromCash, breakevenB, breakevenC } = results
  const lastTrad = traditional[traditional.length - 1]
  const lastRothB = rothFromIRA[rothFromIRA.length - 1]
  const lastRothC = rothFromCash[rothFromCash.length - 1]

  const bestFinal = Math.max(lastTrad.afterTaxWealth, lastRothB.afterTaxWealth, lastRothC.afterTaxWealth)
  let bestStrategy = 'Traditional IRA'
  if (lastRothC.afterTaxWealth === bestFinal) bestStrategy = 'Roth (Tax from Cash)'
  else if (lastRothB.afterTaxWealth === bestFinal) bestStrategy = 'Roth (Tax from IRA)'

  const wealthGain = lastRothC.afterTaxWealth - lastTrad.afterTaxWealth

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      <KPICard
        label="Traditional IRA Final"
        value={fmt(lastTrad.afterTaxWealth)}
        sub={`Balance at age ${results.inputs.endAge}`}
        color="blue"
        accent={`${fmt(lastTrad.cumulativeTaxes)} total taxes paid`}
      />
      <KPICard
        label="Roth Final (Tax from IRA)"
        value={fmt(lastRothB.afterTaxWealth)}
        sub="After-tax wealth at end"
        color="orange"
        accent={`Tax cost: ${fmt(lastRothB.cumulativeTaxesPaid)}`}
      />
      <KPICard
        label="Roth Final (Tax from Cash)"
        value={fmt(lastRothC.afterTaxWealth)}
        sub="Full conversion, external tax"
        color="green"
        accent={wealthGain > 0 ? `+${fmt(wealthGain)} vs Traditional` : `${fmt(wealthGain)} vs Traditional`}
      />
      <KPICard
        label="Breakeven Age"
        value={breakevenC ? `${breakevenC}` : breakevenB ? `${breakevenB}` : 'N/A'}
        sub={breakevenC ? 'Roth (Cash) overtakes Trad.' : breakevenB ? 'Roth (IRA) overtakes Trad.' : 'No crossover in range'}
        color="purple"
        accent={`Best strategy: ${bestStrategy}`}
      />
    </div>
  )
}
