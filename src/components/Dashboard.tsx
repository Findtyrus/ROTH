import React, { useState } from 'react'
import type { ProjectionResults, MonteCarloResults } from '../engine/types'
import { KPICards } from './KPICards'
import { ExportButtons } from './export/ExportButtons'
import { AccountValueChart } from './charts/AccountValueChart'
import { NetWealthChart } from './charts/NetWealthChart'
import { CumulativeTaxChart } from './charts/CumulativeTaxChart'
import { RMDChart } from './charts/RMDChart'
import { BreakevenChart } from './charts/BreakevenChart'
import { MonteCarloChart } from './charts/MonteCarloChart'
import { ProjectionTable } from './tables/ProjectionTable'
import { ExplainerTab } from './ExplainerTab'

interface Props {
  results: ProjectionResults
  mcResults: MonteCarloResults | null
  mcLoading: boolean
}

type Tab = 'overview' | 'wealth' | 'taxes' | 'rmd' | 'breakeven' | 'montecarlo' | 'table' | 'guide'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Account Value' },
  { key: 'wealth', label: 'After-Tax Wealth' },
  { key: 'taxes', label: 'Cumulative Tax' },
  { key: 'rmd', label: 'RMD Schedule' },
  { key: 'breakeven', label: 'Breakeven' },
  { key: 'montecarlo', label: 'Monte Carlo' },
  { key: 'table', label: 'Data Table' },
  { key: 'guide', label: '? Guide' },
]

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 20px 16px',
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

export function Dashboard({ results, mcResults, mcLoading }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Roth Conversion Analyzer
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Ages {results.inputs.currentAge}–{results.inputs.endAge} &nbsp;·&nbsp; ${(results.inputs.initialBalance / 1_000_000).toFixed(1)}M initial balance
          </p>
        </div>
        <ExportButtons results={results} />
      </div>

      {/* KPI cards */}
      <KPICards results={results} />

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, borderBottom: '1px solid var(--border)',
        overflowX: 'auto', paddingBottom: 1,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: 500, border: 'none',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              background: activeTab === tab.key ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === tab.key ? 'var(--blue-light)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--blue)' : '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart panels */}
      {activeTab === 'overview' && (
        <ChartCard title="Account Balance Over Time" sub="Pre-tax account value by year for all three scenarios">
          <AccountValueChart results={results} />
        </ChartCard>
      )}

      {activeTab === 'wealth' && (
        <ChartCard title="After-Tax Wealth" sub="Total spendable wealth (account balance + cumulative net distributions)">
          <NetWealthChart results={results} />
        </ChartCard>
      )}

      {activeTab === 'taxes' && (
        <ChartCard title="Cumulative Taxes Paid" sub="Lifetime tax burden per scenario">
          <CumulativeTaxChart results={results} />
        </ChartCard>
      )}

      {activeTab === 'rmd' && (
        <ChartCard title="Required Minimum Distributions" sub="Annual RMD amounts from the Traditional IRA (Roth has no RMDs)">
          <RMDChart results={results} />
        </ChartCard>
      )}

      {activeTab === 'breakeven' && (
        <ChartCard title="Breakeven Analysis" sub="Roth wealth minus Traditional wealth — positive = Roth is ahead">
          <BreakevenChart results={results} />
        </ChartCard>
      )}

      {activeTab === 'montecarlo' && (
        <ChartCard title="Monte Carlo Simulation" sub={mcResults ? `${mcResults.runs.toLocaleString()} paths · ±12% annual std dev · shaded bands P10–P90 and P25–P75` : 'Running simulation...'}>
          {mcLoading && (
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Running 1,000 simulations…
            </div>
          )}
          {!mcLoading && mcResults && <MonteCarloChart mcResults={mcResults} />}
        </ChartCard>
      )}

      {activeTab === 'table' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Year-by-Year Projection</div>
          <ProjectionTable results={results} />
        </div>
      )}

      {activeTab === 'guide' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 32px' }}>
          <ExplainerTab />
        </div>
      )}
    </div>
  )
}
