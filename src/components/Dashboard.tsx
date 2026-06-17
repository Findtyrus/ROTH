import React, { useState, useRef } from 'react'
import type { ProjectionResults, MonteCarloResults, DistributionInputs, DistYearData, ReportMeta } from '../engine/types'
import { KPICards } from './KPICards'
import { ExportButtons } from './export/ExportButtons'
import { LightModeToggle } from './LightModeToggle'
import { AccountValueChart } from './charts/AccountValueChart'
import { NetWealthChart } from './charts/NetWealthChart'
import { CumulativeTaxChart } from './charts/CumulativeTaxChart'
import { RMDChart } from './charts/RMDChart'
import { BreakevenChart } from './charts/BreakevenChart'
import { MonteCarloChart } from './charts/MonteCarloChart'
import { CustomDistChart } from './charts/CustomDistChart'
import { ProjectionTable } from './tables/ProjectionTable'
import { ExplainerTab } from './ExplainerTab'
import { GuideTab } from './GuideTab'
import { CRMTab } from './CRMTab'
import { generateClientReport } from '../utils/clientReportPdf'
import { fmtFull } from '../utils/formatters'

interface Props {
  results: ProjectionResults
  mcResults: MonteCarloResults | null
  mcLoading: boolean
  distInputs: DistributionInputs
  distData: DistYearData[] | null
  onLoadClient: (inputs: any, distInputs: any) => void
  currentInputs: any
}

type Tab = 'overview' | 'wealth' | 'taxes' | 'rmd' | 'breakeven' | 'montecarlo' | 'distributions' | 'table' | 'guide' | 'math' | 'crm'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'breakeven', label: 'Breakeven' },
  { key: 'distributions', label: 'Distributions' },
  { key: 'montecarlo', label: 'Monte Carlo' },
  { key: 'table', label: 'Data Table' },
  { key: 'math', label: 'Math Guide' },
  { key: 'guide', label: 'Explainer' },
  { key: 'crm', label: 'Clients' },
]

function ChartCard({ title, sub, children, cardRef }: {
  title: string; sub?: string; children: React.ReactNode; cardRef?: React.RefObject<HTMLDivElement>
}) {
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
      <div ref={cardRef}>{children}</div>
    </div>
  )
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 6, color: 'var(--text-primary)', padding: '7px 10px',
  fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', marginTop: 4,
}

export function Dashboard({ results, mcResults, mcLoading, distInputs, distData, onLoadClient, currentInputs }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportMeta, setReportMeta] = useState<ReportMeta>({
    clientName: '', advisorName: '', firmName: '', disclosureText: '',
  })
  const [generating, setGenerating] = useState(false)

  // Chart refs for PDF capture
  const netWealthRef = useRef<HTMLDivElement>(null)
  const breakevenRef = useRef<HTMLDivElement>(null)
  const distRef = useRef<HTMLDivElement>(null)

  async function handleGenerateReport() {
    setGenerating(true)
    try {
      await generateClientReport(
        results,
        distData,
        reportMeta,
        {
          netWealth: netWealthRef.current,
          breakeven: breakevenRef.current,
          customDist: distRef.current,
        },
      )
    } finally {
      setGenerating(false)
      setShowReportModal(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Roth Conversion Analyzer
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Ages {results.inputs.currentAge}–{results.inputs.endAge} &nbsp;·&nbsp; {fmtFull(results.inputs.initialBalance)} initial balance
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <LightModeToggle />
          <ExportButtons results={results} />
          <button
            onClick={() => setShowReportModal(true)}
            style={{
              background: 'var(--green-dim)', border: '1px solid var(--green)',
              borderRadius: 6, color: 'var(--green-light)',
              padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Client Report
          </button>
        </div>
      </div>

      <KPICards results={results} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', overflowX: 'auto', paddingBottom: 1 }}>
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
              whiteSpace: 'nowrap', transition: 'all 0.15s', cursor: 'pointer',
            }}
          >
            {tab.label}
            {tab.key === 'crm' && (
              <span style={{
                marginLeft: 5, background: 'var(--blue-dim)', color: 'var(--blue-light)',
                borderRadius: 8, padding: '1px 5px', fontSize: 10,
              }}>
                {JSON.parse(localStorage.getItem('roth-clients') || '[]').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ChartCard title="Account Balance Over Time" sub="Pre-tax account value by year for all three scenarios" cardRef={undefined}>
            <AccountValueChart results={results} />
          </ChartCard>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <ChartCard title="After-Tax Wealth" sub="Total spendable wealth including cumulative net distributions" cardRef={netWealthRef}>
              <NetWealthChart results={results} />
            </ChartCard>
            <ChartCard title="Cumulative Taxes Paid" sub="Lifetime tax burden per scenario">
              <CumulativeTaxChart results={results} />
            </ChartCard>
          </div>
          <ChartCard title="RMD Schedule" sub="Traditional IRA required minimum distributions (Roth has none)">
            <RMDChart results={results} />
          </ChartCard>
        </div>
      )}

      {/* ── BREAKEVEN ── */}
      {activeTab === 'breakeven' && (
        <ChartCard title="Breakeven Analysis" sub="Roth wealth minus Traditional wealth — positive means Roth is ahead" cardRef={breakevenRef}>
          <BreakevenChart results={results} />
        </ChartCard>
      )}

      {/* ── DISTRIBUTIONS ── */}
      {activeTab === 'distributions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!distInputs.enabled ? (
            <div style={{
              padding: '48px 24px', textAlign: 'center',
              border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
              color: 'var(--text-muted)', fontSize: 13,
            }}>
              Enable Monthly Distributions in the left panel to see distribution projections.
            </div>
          ) : distData ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Starting Monthly Dist.', value: fmtFull(distInputs.monthlyDistribution), color: 'var(--green)' },
                  { label: 'Total Distributions', value: fmtFull(distData[distData.length - 1].cumulativeDistributions), color: 'var(--blue-light)' },
                  { label: 'Final Roth Balance', value: fmtFull(distData[distData.length - 1].endBalance), color: 'var(--orange-light)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--font-mono)', marginTop: 6 }}>{value}</div>
                  </div>
                ))}
              </div>
              <ChartCard
                title="Roth Balance with Systematic Withdrawals"
                sub={`$${distInputs.monthlyDistribution.toLocaleString()}/mo starting at age ${distInputs.distributionStartAge}, growing ${(distInputs.distributionIncreaseRate * 100).toFixed(1)}% annually`}
                cardRef={distRef}
              >
                <CustomDistChart distData={distData} />
              </ChartCard>
            </>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Computing…</div>
          )}
        </div>
      )}

      {/* ── MONTE CARLO ── */}
      {activeTab === 'montecarlo' && (
        <ChartCard title="Monte Carlo Simulation" sub={mcResults ? `${mcResults.runs.toLocaleString()} paths · ±12% std dev · bands show P10–P90 and P25–P75` : 'Running simulation…'}>
          {mcLoading && (
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Running 1,000 simulations…
            </div>
          )}
          {!mcLoading && mcResults && <MonteCarloChart mcResults={mcResults} />}
        </ChartCard>
      )}

      {/* ── DATA TABLE ── */}
      {activeTab === 'table' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Year-by-Year Projection</div>
          <ProjectionTable results={results} />
        </div>
      )}

      {/* ── MATH GUIDE ── */}
      {activeTab === 'math' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 32px' }}>
          <GuideTab results={results} distInputs={distInputs} distData={distData} />
        </div>
      )}

      {/* ── EXPLAINER ── */}
      {activeTab === 'guide' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 32px' }}>
          <ExplainerTab />
        </div>
      )}

      {/* ── CRM ── */}
      {activeTab === 'crm' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <CRMTab currentInputs={currentInputs} currentDistInputs={distInputs} onLoadClient={onLoadClient} />
        </div>
      )}

      {/* ── CLIENT REPORT MODAL ── */}
      {showReportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-xl)', padding: '28px', width: '100%', maxWidth: 520,
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Generate Client Report</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              Professional multi-page PDF with charts and disclosures. All fields optional.
            </div>

            {([
              ['Client Name', 'clientName', 'e.g. John & Jane Smith'],
              ['Advisor Name', 'advisorName', 'e.g. Sarah Johnson, CFP'],
              ['Firm Name', 'firmName', 'e.g. Acme Wealth Management'],
            ] as [string, keyof ReportMeta, string][]).map(([label, key, placeholder]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
                <input
                  value={reportMeta[key]}
                  onChange={e => setReportMeta(m => ({ ...m, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Custom Firm Disclosure (optional)</label>
              <textarea
                value={reportMeta.disclosureText}
                onChange={e => setReportMeta(m => ({ ...m, disclosureText: e.target.value }))}
                placeholder="Additional regulatory disclosure or firm-specific language…"
                rows={3}
                style={{ ...INPUT_STYLE, resize: 'vertical' }}
                onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              The report captures the current chart views. For best chart quality, visit the <strong>Overview</strong> and <strong>Breakeven</strong> tabs before generating.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                style={{
                  background: generating ? 'var(--bg-elevated)' : 'var(--blue)',
                  border: 'none', color: generating ? 'var(--text-muted)' : '#fff',
                  borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: generating ? 'default' : 'pointer',
                }}
              >
                {generating ? 'Generating PDF…' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
