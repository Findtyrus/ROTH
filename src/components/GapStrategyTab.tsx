import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { PlanInputs } from '../engine/types'
import type { FilingStatus } from '../engine/taxBrackets'
import { calculateConversionTax, getBracketPosition } from '../engine/taxBrackets'
import { fmtFull, fmtPct } from '../utils/formatters'

interface Props {
  inputs: PlanInputs
  filingStatus: FilingStatus
  existingIncome: number
}

const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  married_joint: 'Married Filing Jointly',
  married_separate: 'Married Filing Separately',
  head_of_household: 'Head of Household',
}

const STRATEGY_COLORS = ['var(--green)', 'var(--orange)', 'var(--red, #ff3b30)']

function StatRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)' }}>{value}</span>
    </div>
  )
}

interface StrategyResult {
  label: string
  shortLabel: string
  amount: number
  federalTax: number
  stateTax: number
  totalTax: number
  effectiveRate: number
  bracketsEntered: number
}

function buildStrategy(
  label: string,
  shortLabel: string,
  amount: number,
  existingIncome: number,
  filingStatus: FilingStatus,
  stateRate: number,
): StrategyResult {
  if (amount <= 0) {
    return { label, shortLabel, amount: 0, federalTax: 0, stateTax: 0, totalTax: 0, effectiveRate: 0, bracketsEntered: 0 }
  }
  const r = calculateConversionTax(existingIncome, amount, filingStatus, stateRate)
  return {
    label,
    shortLabel,
    amount,
    federalTax: r.federalTaxOnConversion,
    stateTax: r.stateTaxOnConversion,
    totalTax: r.totalTaxOnConversion,
    effectiveRate: r.effectiveRateOnConversion,
    bracketsEntered: r.bracketBreakdown.length,
  }
}

export function GapStrategyTab({ inputs, filingStatus, existingIncome }: Props) {
  const pos = getBracketPosition(existingIncome, filingStatus)
  const stateRate = inputs.stateTaxRate

  const s1Amount = pos.roomToNextBracket > 0
    ? Math.min(pos.roomToNextBracket, inputs.initialBalance)
    : 0

  const s2Amount = pos.roomToNextBracket > 0 && pos.nextBracketWidth !== null
    ? Math.min(pos.roomToNextBracket + pos.nextBracketWidth, inputs.initialBalance)
    : pos.roomToNextBracket > 0
      ? Math.min(pos.roomToNextBracket, inputs.initialBalance)
      : Math.min(inputs.initialBalance, inputs.initialBalance)

  const s3Amount = inputs.initialBalance

  const strategy1 = buildStrategy('Fill Current Bracket', 'Strategy 1', s1Amount, existingIncome, filingStatus, stateRate)
  const strategy2 = buildStrategy('Fill Current + Next Bracket', 'Strategy 2', s2Amount, existingIncome, filingStatus, stateRate)
  const strategy3 = buildStrategy('Full Conversion', 'Strategy 3', s3Amount, existingIncome, filingStatus, stateRate)

  const strategies = [strategy1, strategy2, strategy3]

  const chartData = strategies.map((s, i) => ({
    name: `S${i + 1}`,
    label: s.shortLabel,
    tax: Math.round(s.totalTax),
  }))

  const inTopBracket = pos.nextBracketRate === null
  const hasRoom = pos.roomToNextBracket > 0

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const idx = chartData.findIndex(d => d.tax === payload[0].value)
    const s = strategies[idx] ?? strategies[0]
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '10px 14px', fontSize: 12,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{s.label}</div>
        <div style={{ color: 'var(--text-secondary)' }}>Convert: {fmtFull(s.amount)}</div>
        <div style={{ color: 'var(--text-secondary)' }}>Total tax: {fmtFull(s.totalTax)}</div>
        <div style={{ color: 'var(--text-muted)' }}>Effective rate: {fmtPct(s.effectiveRate)}</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Current Situation */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>Current Bracket Position</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <StatRow label="Filing Status" value={FILING_STATUS_LABELS[filingStatus]} mono={false} />
            <StatRow label="Existing Taxable Income" value={fmtFull(existingIncome)} />
            <StatRow label="Current Marginal Bracket" value={fmtPct(pos.currentRate)} />
          </div>
          <div>
            {!inTopBracket && (
              <>
                <StatRow label="Top of Current Bracket" value={fmtFull(pos.topOfBracket)} />
                <StatRow label="Room Before Next Bracket" value={fmtFull(pos.roomToNextBracket)} />
                <StatRow label="Next Bracket Rate" value={fmtPct(pos.nextBracketRate!)} />
              </>
            )}
            {inTopBracket && (
              <StatRow label="Bracket Status" value="Top bracket (37%)" mono={false} />
            )}
          </div>
        </div>
        {!hasRoom && !inTopBracket && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--orange)', background: 'rgba(255,149,0,0.08)', borderRadius: 8, padding: '8px 12px' }}>
            Income is at the bracket boundary. Any conversion immediately enters the next bracket.
          </div>
        )}
        {inTopBracket && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px' }}>
            Already in the top 37% bracket. All conversion dollars face the same marginal rate regardless of amount.
          </div>
        )}
      </div>

      {/* Strategy Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {strategies.map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)',
            border: `1px solid var(--border)`,
            borderTop: `3px solid ${STRATEGY_COLORS[i]}`,
            borderRadius: 'var(--radius-lg)',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
              Strategy {i + 1}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: STRATEGY_COLORS[i], fontFamily: 'var(--font-mono)' }}>
              {fmtFull(s.totalTax)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>total tax owed</div>
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Convert</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{fmtFull(s.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Federal tax</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{fmtFull(s.federalTax)}</span>
              </div>
              {stateRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>State tax</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{fmtFull(s.stateTax)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Effective rate</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{fmtPct(s.effectiveRate)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Tax Owed by Strategy</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Total tax due (federal + state) for each conversion amount</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 20, left: 10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(_, i) => strategies[i]?.label ?? ''}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => {
                if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
                if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
                return `$${v}`
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="tax" radius={[6, 6, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={STRATEGY_COLORS[i]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
        Informational only. Uses 2025 federal tax brackets. Set existing income and filing status in the
        left panel's Tax Bracket Calculator section. Main projections still use the flat tax rate setting.
      </div>
    </div>
  )
}
