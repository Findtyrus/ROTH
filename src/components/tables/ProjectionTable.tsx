import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { ProjectionResults } from '../../engine/types'
import { effectiveTaxRate } from '../../engine/calculator'
import { fmtFull } from '../../utils/formatters'

interface Props { results: ProjectionResults }

const TH: CSSProperties = {
  padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600,
  color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  position: 'sticky', top: 0, background: 'var(--bg-surface)',
}
const TD: CSSProperties = {
  padding: '7px 12px', textAlign: 'right', fontSize: 12,
  fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
}

export function ProjectionTable({ results }: Props) {
  const { traditional, rothFromIRA, rothFromCash, rothFromIRAWithSide } = results
  const [activeScenario, setActiveScenario] = useState<'all' | 'trad' | 'rothB' | 'rothC' | 'rothD'>('all')

  const tabs = [
    { key: 'all',   label: 'All Scenarios' },
    { key: 'trad',  label: 'Traditional' },
    { key: 'rothB', label: 'Roth (IRA Tax)' },
    { key: 'rothC', label: 'Roth (Cash Tax)' },
    { key: 'rothD', label: 'Roth (IRA + Cash Invested)' },
  ] as const

  const show = (s: typeof activeScenario) => activeScenario === 'all' || activeScenario === s

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveScenario(tab.key)}
            style={{
              padding: '5px 12px', fontSize: 12, borderRadius: 20, border: '1px solid',
              borderColor: activeScenario === tab.key ? 'var(--blue)' : 'var(--border)',
              background: activeScenario === tab.key ? 'var(--blue-dim)' : 'var(--bg-elevated)',
              color: activeScenario === tab.key ? 'var(--blue)' : 'var(--text-secondary)',
              fontWeight: activeScenario === tab.key ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{
        overflowX: 'auto', maxHeight: 420, overflowY: 'auto',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left' }}>Age</th>
              {show('trad') && <>
                <th style={TH}>Trad. Balance</th>
                <th style={TH}>RMD</th>
                <th style={TH}>Total Withdrawn</th>
                <th style={TH}>Tax Paid</th>
                <th style={TH}>Net Dist.</th>
                <th style={TH}>Trad. Wealth</th>
              </>}
              {show('rothB') && <>
                <th style={{ ...TH, color: 'var(--orange)' }}>Roth B Balance</th>
                <th style={{ ...TH, color: 'var(--orange)' }}>Roth B Wealth</th>
              </>}
              {show('rothC') && <>
                <th style={{ ...TH, color: 'var(--green-light)' }}>Roth C Balance</th>
                <th style={{ ...TH, color: 'var(--green-light)' }}>Roth C Net</th>
                <th style={{ ...TH, color: 'var(--green-light)' }}>Roth C Gross</th>
              </>}
              {show('rothD') && <>
                <th style={{ ...TH, color: '#bf5af2' }}>Roth D Balance</th>
                <th style={{ ...TH, color: '#bf5af2' }}>Side Account</th>
                <th style={{ ...TH, color: '#bf5af2' }}>Roth D Total</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {traditional.map((t, i) => {
              const b = rothFromIRA[i]
              const c = rothFromCash[i]
              const d = rothFromIRAWithSide[i]
              const isRmdYear = t.rmdAmount > 0
              return (
                <tr
                  key={t.age}
                  style={{ background: isRmdYear ? 'rgba(0,113,227,0.03)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,113,227,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = isRmdYear ? 'rgba(0,113,227,0.03)' : 'transparent')}
                >
                  <td style={{ ...TD, textAlign: 'left', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                    {t.age}
                    {isRmdYear && (
                      <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--blue)', fontFamily: 'var(--font-body)', letterSpacing: '0.05em' }}>
                        RMD
                      </span>
                    )}
                  </td>
                  {show('trad') && <>
                    <td style={{ ...TD, color: 'var(--text-primary)' }}>{fmtFull(t.endBalance)}</td>
                    <td style={{ ...TD, color: t.rmdAmount > 0 ? 'var(--blue)' : 'var(--text-muted)' }}>{fmtFull(t.rmdAmount)}</td>
                    <td style={{ ...TD, color: t.totalWithdrawal > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{fmtFull(t.totalWithdrawal)}</td>
                    <td style={{ ...TD, color: t.taxesPaid > 0 ? 'var(--red)' : 'var(--text-muted)' }}>{fmtFull(t.taxesPaid)}</td>
                    <td style={{ ...TD, color: 'var(--text-secondary)' }}>{fmtFull(t.netDistribution)}</td>
                    <td style={{ ...TD, color: 'var(--blue)', fontWeight: 600 }}>{fmtFull(t.afterTaxWealth)}</td>
                  </>}
                  {show('rothB') && <>
                    <td style={{ ...TD, color: 'var(--text-primary)' }}>{fmtFull(b.endBalance)}</td>
                    <td style={{ ...TD, color: 'var(--orange)', fontWeight: 600 }}>{fmtFull(b.afterTaxWealth)}</td>
                  </>}
                  {show('rothC') && <>
                    <td style={{ ...TD, color: 'var(--text-primary)' }}>{fmtFull(c.endBalance)}</td>
                    <td style={{ ...TD, color: 'var(--green-light)', fontWeight: 600 }}>{fmtFull(c.afterTaxWealth)}</td>
                    <td style={{ ...TD, color: 'var(--text-muted)' }}>{fmtFull(c.afterTaxWealthGross)}</td>
                  </>}
                  {show('rothD') && <>
                    <td style={{ ...TD, color: 'var(--text-primary)' }}>{fmtFull(d.endBalance)}</td>
                    <td style={{ ...TD, color: '#bf5af2' }}>{fmtFull(d.sideAccountBalance)}</td>
                    <td style={{ ...TD, color: '#bf5af2', fontWeight: 600 }}>{fmtFull(d.afterTaxWealth)}</td>
                  </>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Traditional Wealth = remaining balance × (1 − {Math.round(effectiveTaxRate(results.inputs) * 100)}% tax) + cumulative net distributions. &nbsp;
        Roth C Net = account wealth − total cash paid at conversion. &nbsp;
        Roth D Total = Roth B wealth + side account (cash invested separately, not used for withdrawals).
      </div>
    </div>
  )
}
