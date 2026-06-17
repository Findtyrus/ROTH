import React, { useState } from 'react'
import type { ProjectionResults } from '../../engine/types'
import { fmtFull } from '../../utils/formatters'

interface Props { results: ProjectionResults }

const TH_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'right',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  background: 'var(--bg-surface)',
}

const TD_STYLE: React.CSSProperties = {
  padding: '7px 12px',
  textAlign: 'right',
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

export function ProjectionTable({ results }: Props) {
  const { traditional, rothFromIRA, rothFromCash } = results
  const [activeScenario, setActiveScenario] = useState<'all' | 'trad' | 'rothB' | 'rothC'>('all')

  const tabs = [
    { key: 'all', label: 'All Scenarios' },
    { key: 'trad', label: 'Traditional' },
    { key: 'rothB', label: 'Roth (IRA Tax)' },
    { key: 'rothC', label: 'Roth (Cash Tax)' },
  ] as const

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveScenario(tab.key)}
            style={{
              padding: '5px 12px', fontSize: 12, borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: activeScenario === tab.key ? 'var(--blue)' : 'var(--border)',
              background: activeScenario === tab.key ? 'var(--blue-dim)' : 'var(--bg-elevated)',
              color: activeScenario === tab.key ? 'var(--blue-light)' : 'var(--text-secondary)',
              fontWeight: activeScenario === tab.key ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...TH_STYLE, textAlign: 'left' }}>Age</th>
              {(activeScenario === 'all' || activeScenario === 'trad') && <>
                <th style={TH_STYLE}>Trad. Balance</th>
                <th style={TH_STYLE}>RMD</th>
                <th style={TH_STYLE}>Tax Paid</th>
                <th style={TH_STYLE}>Net Dist.</th>
                <th style={TH_STYLE}>Trad. Wealth</th>
              </>}
              {(activeScenario === 'all' || activeScenario === 'rothB') && <>
                <th style={{ ...TH_STYLE, color: 'var(--orange-light)' }}>Roth B Balance</th>
                <th style={{ ...TH_STYLE, color: 'var(--orange-light)' }}>Roth B Wealth</th>
              </>}
              {(activeScenario === 'all' || activeScenario === 'rothC') && <>
                <th style={{ ...TH_STYLE, color: 'var(--green-light)' }}>Roth C Balance</th>
                <th style={{ ...TH_STYLE, color: 'var(--green-light)' }}>Roth C Wealth</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {traditional.map((t, i) => {
              const b = rothFromIRA[i]
              const c = rothFromCash[i]
              const isRmdYear = t.rmdAmount > 0
              return (
                <tr
                  key={t.age}
                  style={{
                    background: isRmdYear ? 'rgba(59,130,246,0.04)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,179,237,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = isRmdYear ? 'rgba(59,130,246,0.04)' : 'transparent')}
                >
                  <td style={{ ...TD_STYLE, textAlign: 'left', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                    {t.age}
                    {isRmdYear && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--blue)', fontFamily: 'var(--font-body)', letterSpacing: '0.05em' }}>RMD</span>}
                  </td>
                  {(activeScenario === 'all' || activeScenario === 'trad') && <>
                    <td style={{ ...TD_STYLE, color: 'var(--text-primary)' }}>{fmtFull(t.endBalance)}</td>
                    <td style={{ ...TD_STYLE, color: t.rmdAmount > 0 ? 'var(--blue-light)' : 'var(--text-muted)' }}>{fmtFull(t.rmdAmount)}</td>
                    <td style={{ ...TD_STYLE, color: t.taxesPaid > 0 ? 'var(--red)' : 'var(--text-muted)' }}>{fmtFull(t.taxesPaid)}</td>
                    <td style={{ ...TD_STYLE, color: 'var(--text-secondary)' }}>{fmtFull(t.netDistribution)}</td>
                    <td style={{ ...TD_STYLE, color: 'var(--blue-light)', fontWeight: 600 }}>{fmtFull(t.afterTaxWealth)}</td>
                  </>}
                  {(activeScenario === 'all' || activeScenario === 'rothB') && <>
                    <td style={{ ...TD_STYLE, color: 'var(--text-primary)' }}>{fmtFull(b.endBalance)}</td>
                    <td style={{ ...TD_STYLE, color: 'var(--orange-light)', fontWeight: 600 }}>{fmtFull(b.afterTaxWealth)}</td>
                  </>}
                  {(activeScenario === 'all' || activeScenario === 'rothC') && <>
                    <td style={{ ...TD_STYLE, color: 'var(--text-primary)' }}>{fmtFull(c.endBalance)}</td>
                    <td style={{ ...TD_STYLE, color: 'var(--green-light)', fontWeight: 600 }}>{fmtFull(c.afterTaxWealth)}</td>
                  </>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
