import React from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import type { ProjectionResults } from '../../engine/types'
import { axisFmt, fmtFull } from '../../utils/formatters'

interface Props { results: ProjectionResults }

export function BreakevenChart({ results }: Props) {
  const { traditional, rothFromIRA, rothFromCash, breakevenB, breakevenC } = results

  // Both use corrected afterTaxWealth: Traditional reflects liquidation value,
  // Roth C uses net wealth (gross minus external cash tax paid)
  const data = traditional.map((t, i) => ({
    age: t.age,
    deltaC: Math.round(rothFromCash[i].afterTaxWealth - t.afterTaxWealth),
    deltaB: Math.round(rothFromIRA[i].afterTaxWealth - t.afterTaxWealth),
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-md)', padding: '12px 16px', minWidth: 240,
      }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8 }}>
          Age {label} — Roth advantage over Traditional
        </div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 4 }}>
            <span style={{ color: p.color, fontSize: 12 }}>{p.name}</span>
            <span style={{
              color: p.value >= 0 ? 'var(--green)' : 'var(--red)',
              fontSize: 12, fontFamily: 'var(--font-mono)',
            }}>
              {p.value >= 0 ? '+' : ''}{fmtFull(p.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="age" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <YAxis tickFormatter={axisFmt} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
          <ReferenceLine y={0} stroke="var(--border-accent)" strokeWidth={1.5} />
          <Line dataKey="deltaC" name="Roth (Cash) Net − Traditional" stroke="var(--green)" strokeWidth={2.5} dot={false} />
          <Line dataKey="deltaB" name="Roth (IRA) − Traditional" stroke="var(--orange)" strokeWidth={2.5} dot={false} strokeDasharray="6 3" />
          {breakevenC && (
            <ReferenceLine x={breakevenC} stroke="var(--green)" strokeDasharray="4 4"
              label={{ value: `Age ${breakevenC}`, fill: 'var(--green)', fontSize: 10, position: 'insideTopLeft' }} />
          )}
          {breakevenB && (
            <ReferenceLine x={breakevenB} stroke="var(--orange)" strokeDasharray="4 4"
              label={{ value: `Age ${breakevenB}`, fill: 'var(--orange)', fontSize: 10, position: 'insideTopRight' }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
