import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { ProjectionResults } from '../../engine/types'
import { axisFmt, fmtFull } from '../../utils/formatters'

interface Props { results: ProjectionResults }

export function RMDChart({ results }: Props) {
  const data = results.traditional
    .filter(t => t.rmdAmount > 0)
    .map(t => ({ age: t.age, rmd: t.rmdAmount, net: t.netDistribution }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const rmd = payload.find((p: any) => p.dataKey === 'rmd')?.value ?? 0
    const net = payload.find((p: any) => p.dataKey === 'net')?.value ?? 0
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8 }}>Age {label}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Gross RMD: <span style={{ color: 'var(--blue-light)', fontFamily: 'var(--font-mono)' }}>{fmtFull(rmd)}</span></div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Net (After Tax): <span style={{ color: 'var(--green-light)', fontFamily: 'var(--font-mono)' }}>{fmtFull(net)}</span></div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }} barGap={-16}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
          <XAxis dataKey="age" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <YAxis tickFormatter={axisFmt} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="rmd" name="Gross RMD" fill="rgba(59,130,246,0.35)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="net" name="Net After Tax" fill="var(--green)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
