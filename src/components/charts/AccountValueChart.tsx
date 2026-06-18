import React from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine,
} from 'recharts'
import type { ProjectionResults } from '../../engine/types'
import { axisFmt, fmtFull } from '../../utils/formatters'

interface Props { results: ProjectionResults }

export function AccountValueChart({ results }: Props) {
  const { traditional, rothFromIRA, rothFromCash, breakevenC, breakevenB } = results

  const data = traditional.map((t, i) => ({
    age: t.age,
    traditional: t.endBalance,
    rothIRA: rothFromIRA[i].endBalance,
    rothCash: rothFromCash[i].endBalance,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-md)', padding: '12px 16px', minWidth: 200,
      }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8 }}>Age {label} — Account Balance</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 4 }}>
            <span style={{ color: p.color, fontSize: 12 }}>{p.name}</span>
            <span style={{ color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              {fmtFull(p.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="age" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <YAxis tickFormatter={axisFmt} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>}
          />
          <Line dataKey="traditional" name="Traditional IRA" stroke="var(--blue)" strokeWidth={2.5} dot={false} />
          <Line dataKey="rothIRA" name="Roth (Tax from IRA)" stroke="var(--orange)" strokeWidth={2.5} dot={false} strokeDasharray="6 3" />
          <Line dataKey="rothCash" name="Roth (Tax from Cash)" stroke="var(--green)" strokeWidth={2.5} dot={false} />
          {breakevenB && (
            <ReferenceLine x={breakevenB} stroke="var(--orange)" strokeDasharray="4 4"
              label={{ value: `BE-B: ${breakevenB}`, fill: 'var(--orange)', fontSize: 10, position: 'insideTopLeft' }} />
          )}
          {breakevenC && (
            <ReferenceLine x={breakevenC} stroke="var(--green)" strokeDasharray="4 4"
              label={{ value: `BE-C: ${breakevenC}`, fill: 'var(--green)', fontSize: 10, position: 'insideTopRight' }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
