import React from 'react'
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import type { MonteCarloResults } from '../../engine/types'
import { axisFmt, fmtFull } from '../../utils/formatters'

interface Props { mcResults: MonteCarloResults }

export function MonteCarloChart({ mcResults }: Props) {
  const data = mcResults.traditional.map((t, i) => {
    const r = mcResults.rothFromCash[i]
    return {
      age: t.age,
      // Traditional bands: [p10, p90] and [p25, p75]
      tradRange: [t.p10, t.p90] as [number, number],
      tradInner: [t.p25, t.p75] as [number, number],
      tradP50: t.p50,
      // Roth bands
      rothRange: [r.p10, r.p90] as [number, number],
      rothInner: [r.p25, r.p75] as [number, number],
      rothP50: r.p50,
      // For recharts Area we need bottom/top values
      tradLow: t.p10,
      tradHigh: t.p90,
      tradMidLow: t.p25,
      tradMidHigh: t.p75,
      rothLow: r.p10,
      rothHigh: r.p90,
      rothMidLow: r.p25,
      rothMidHigh: r.p75,
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const get = (key: string) => payload.find((p: any) => p.dataKey === key)?.value ?? 0
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)', padding: '12px 16px', minWidth: 240 }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 10 }}>Age {label} — Monte Carlo ({mcResults.runs.toLocaleString()} runs)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', fontSize: 11 }}>
          <span style={{ color: 'var(--text-muted)' }}>Traditional</span>
          <span style={{ color: 'var(--text-muted)' }}>Roth (Cash)</span>
          <span style={{ color: 'var(--blue-light)', fontFamily: 'var(--font-mono)' }}>P50: {fmtFull(get('tradP50'))}</span>
          <span style={{ color: 'var(--green-light)', fontFamily: 'var(--font-mono)' }}>P50: {fmtFull(get('rothP50'))}</span>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>P10: {fmtFull(get('tradLow'))}</span>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>P10: {fmtFull(get('rothLow'))}</span>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>P90: {fmtFull(get('tradHigh'))}</span>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>P90: {fmtFull(get('rothHigh'))}</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="mcTradOuter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="mcTradInner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="mcRothOuter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="mcRothInner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
          <XAxis dataKey="age" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <YAxis tickFormatter={axisFmt} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />

          {/* Traditional bands */}
          <Area type="monotone" dataKey="tradHigh" stroke="none" fill="url(#mcTradOuter)" legendType="none" />
          <Area type="monotone" dataKey="tradLow" stroke="none" fill="var(--bg-base)" legendType="none" />
          <Area type="monotone" dataKey="tradMidHigh" stroke="none" fill="url(#mcTradInner)" legendType="none" />
          <Area type="monotone" dataKey="tradMidLow" stroke="none" fill="var(--bg-base)" legendType="none" />
          <Line dataKey="tradP50" name="Traditional P50" stroke="var(--blue-light)" strokeWidth={2} dot={false} />

          {/* Roth bands */}
          <Area type="monotone" dataKey="rothHigh" stroke="none" fill="url(#mcRothOuter)" legendType="none" />
          <Area type="monotone" dataKey="rothLow" stroke="none" fill="var(--bg-base)" legendType="none" />
          <Area type="monotone" dataKey="rothMidHigh" stroke="none" fill="url(#mcRothInner)" legendType="none" />
          <Area type="monotone" dataKey="rothMidLow" stroke="none" fill="var(--bg-base)" legendType="none" />
          <Line dataKey="rothP50" name="Roth (Cash) P50" stroke="var(--green-light)" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
