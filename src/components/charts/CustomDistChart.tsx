import React from 'react'
import {
  ResponsiveContainer, ComposedChart, Area, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import type { DistYearData } from '../../engine/types'
import { axisFmt, fmtFull } from '../../utils/formatters'

interface Props {
  distData: DistYearData[]
  tradDistData?: DistYearData[]
  chartRef?: React.RefObject<HTMLDivElement>
}

export function CustomDistChart({ distData, tradDistData, chartRef }: Props) {
  const data = distData.map((d, i) => ({
    age: d.age,
    rothBalance: d.endBalance,
    rothDist: d.annualDistribution,
    tradBalance: tradDistData?.[i]?.endBalance,
    tradDist: tradDistData?.[i]?.annualDistribution,
  }))

  const depletionAge = distData.find(d => d.depleted)?.age

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-md)', padding: '12px 16px', minWidth: 220,
      }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8 }}>Age {label}</div>
        {payload.map((p: any) => p.value !== undefined && (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
            <span style={{ color: p.color ?? p.fill, fontSize: 12 }}>{p.name}</span>
            <span style={{ color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              {fmtFull(p.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={chartRef} style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
          <XAxis dataKey="age" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <YAxis tickFormatter={axisFmt} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />

          <Area type="monotone" dataKey="rothBalance" name="Roth Balance" stroke="var(--green-light)" fill="rgba(16,185,129,0.12)" strokeWidth={2.5} />
          {tradDistData && (
            <Area type="monotone" dataKey="tradBalance" name="Traditional Balance" stroke="var(--blue-light)" fill="rgba(59,130,246,0.10)" strokeWidth={2} strokeDasharray="6 3" />
          )}
          <Bar dataKey="rothDist" name="Annual Distribution (Roth)" fill="rgba(16,185,129,0.5)" radius={[2, 2, 0, 0]} yAxisId={0} />
          {depletionAge && (
            <ReferenceLine x={depletionAge} stroke="var(--red)" strokeDasharray="4 4"
              label={{ value: `Depleted: ${depletionAge}`, fill: 'var(--red)', fontSize: 10, position: 'insideTopLeft' }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
