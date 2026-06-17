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

  const data = traditional.map((t, i) => ({
    age: t.age,
    deltaC: Math.round(rothFromCash[i].afterTaxWealth - t.afterTaxWealth),
    deltaB: Math.round(rothFromIRA[i].afterTaxWealth - t.afterTaxWealth),
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)', padding: '12px 16px', minWidth: 220 }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8 }}>Age {label} — Roth vs Traditional</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 4 }}>
            <span style={{ color: p.color, fontSize: 12 }}>{p.name}</span>
            <span style={{
              color: p.value >= 0 ? 'var(--green-light)' : 'var(--red)',
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
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
          <XAxis dataKey="age" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <YAxis tickFormatter={axisFmt} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <Line dataKey="deltaC" name="Roth (Cash) − Traditional" stroke="var(--green-light)" strokeWidth={2.5} dot={false} />
          <Line dataKey="deltaB" name="Roth (IRA) − Traditional" stroke="var(--orange-light)" strokeWidth={2.5} dot={false} strokeDasharray="6 3" />
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
