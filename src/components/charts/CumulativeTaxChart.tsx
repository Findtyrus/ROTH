import React from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import type { ProjectionResults } from '../../engine/types'
import { axisFmt, fmtFull } from '../../utils/formatters'

interface Props { results: ProjectionResults }

export function CumulativeTaxChart({ results }: Props) {
  const { traditional, rothFromIRA, rothFromCash } = results
  const data = traditional.map((t, i) => ({
    age: t.age,
    traditional: t.cumulativeTaxes,
    rothIRA: rothFromIRA[i].cumulativeTaxesPaid,
    rothCash: rothFromCash[i].cumulativeTaxesPaid,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-md)', padding: '12px 16px',
      }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8 }}>Age {label} — Cumulative Taxes</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 4 }}>
            <span style={{ color: p.stroke, fontSize: 12 }}>{p.name}</span>
            <span style={{ color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{fmtFull(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0071e3" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#0071e3" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff9500" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#ff9500" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34c759" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#34c759" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="age" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <YAxis tickFormatter={axisFmt} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
          <Area type="monotone" dataKey="traditional" name="Traditional IRA" stroke="var(--blue)" fill="url(#tGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="rothIRA" name="Roth (Tax from IRA)" stroke="var(--orange)" fill="url(#bGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="rothCash" name="Roth (Tax from Cash)" stroke="var(--green)" fill="url(#cGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
