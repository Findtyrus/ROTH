import React, { useState, useRef } from 'react'
import type { ProjectionResults, MonteCarloResults, DistributionInputs, DistYearData, ReportMeta } from '../engine/types'
import { effectiveTaxRate } from '../engine/calculator'
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
import { fmt, fmtFull } from '../utils/formatters'

interface Props {
  results: ProjectionResults
  mcResults: MonteCarloResults | null
  mcLoading: boolean
  distInputs: DistributionInputs
  distData: DistYearData[] | null
  onLoadClient: (inputs: any, distInputs: any) => void
  currentInputs: any
}

type MainTab = 'overview' | 'distributions' | 'montecarlo' | 'table' | 'math' | 'guide' | 'crm'
type ChartView = 'wealth' | 'balance' | 'taxes' | 'rmd' | 'breakeven'

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: 'overview', label: 'Charts' },
  { key: 'distributions', label: 'Distributions' },
  { key: 'montecarlo', label: 'Monte Carlo' },
  { key: 'table', label: 'Data Table' },
  { key: 'math', label: 'Math Guide' },
  { key: 'guide', label: 'Explainer' },
  { key: 'crm', label: 'Clients' },
]

const CHART_VIEWS: { key: ChartView; label: string }[] = [
  { key: 'wealth', label: 'After-Tax Wealth' },
  { key: 'balance', label: 'Account Balance' },
  { key: 'taxes', label: 'Cumulative Taxes' },
  { key: 'rmd', label: 'RMD Schedule' },
  { key: 'breakeven', label: 'Breakeven' },
]

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  marginTop: 4,
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardSection({ title, sub, children, cardRef }: {
  title: string; sub?: string; children: React.ReactNode; cardRef?: React.RefObject<HTMLDivElement>
}) {
  return (
    <Card style={{ padding: '20px 22px 18px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
      </div>
      <div ref={cardRef}>{children}</div>
    </Card>
  )
}

export function Dashboard({ results, mcResults, mcLoading, distInputs, distData, onLoadClient, currentInputs }: Props) {
  const [activeTab, setActiveTab] = useState<MainTab>('overview')
  const [chartView, setChartView] = useState<ChartView>('wealth')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportMeta, setReportMeta] = useState<ReportMeta>({
    clientName: '', advisorName: '', firmName: '', disclosureText: '',
  })
  const [generating, setGenerating] = useState(false)

  const netWealthRef = useRef<HTMLDivElement>(null)
  const breakevenRef = useRef<HTMLDivElement>(null)
  const distRef = useRef<HTMLDivElement>(null)

  const { inputs, traditional, rothFromIRA, rothFromCash, breakevenB, breakevenC } = results
  const lastTrad = traditional[traditional.length - 1]
  const lastRothC = rothFromCash[rothFromCash.length - 1]
  const taxRate = effectiveTaxRate(inputs)

  const bestFinal = Math.max(lastTrad.afterTaxWealth, rothFromIRA[rothFromIRA.length - 1].afterTaxWealth, lastRothC.afterTaxWealth)
  let bestStrategy = 'Traditional IRA'
  let bestColor = 'var(--blue)'
  if (lastRothC.afterTaxWealth === bestFinal) { bestStrategy = 'Roth — Tax from Cash'; bestColor = 'var(--green)' }
  else if (rothFromIRA[rothFromIRA.length - 1].afterTaxWealth === bestFinal) { bestStrategy = 'Roth — Tax from IRA'; bestColor = 'var(--orange)' }

  const advantage = bestFinal - lastTrad.afterTaxWealth
  const bestBreakeven = breakevenC ?? breakevenB

  async function handleGenerateReport() {
    setGenerating(true)
    try {
      await generateClientReport(results, distData, reportMeta, {
        netWealth: netWealthRef.current,
        breakeven: breakevenRef.current,
        customDist: distRef.current,
      })
    } finally {
      setGenerating(false)
      setShowReportModal(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: 'var(--text-primary)',
            letterSpacing: '-0.03em', fontFamily: 'var(--font-display)',
          }}>
            Roth Conversion Analyzer
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Ages {inputs.currentAge}–{inputs.endAge} · {fmtFull(inputs.initialBalance)} starting balance
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <LightModeToggle />
          <ExportButtons results={results} />
          <button
            onClick={() => setShowReportModal(true)}
            style={{
              background: 'var(--blue)', border: 'none', borderRadius: 8,
              color: '#fff', padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Client Report
          </button>
        </div>
      </div>

      {/* ── Recommendation Hero ── */}
      <Card style={{
        padding: '24px 28px',
        background: 'var(--bg-surface)',
        borderColor: bestColor,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 24,
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Recommended Strategy
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            {bestStrategy}
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {advantage > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Estimated advantage by age {inputs.endAge}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: bestColor, fontFamily: 'var(--font-mono)' }}>
                  +{fmt(advantage)}
                </div>
              </div>
            )}
            {bestBreakeven && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Breakeven age</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {bestBreakeven}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Final after-tax wealth</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {fmt(bestFinal)}
              </div>
            </div>
          </div>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-muted)', maxWidth: 220, lineHeight: 1.6,
          padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10,
        }}>
          Based on current assumptions. Traditional after-tax wealth reflects liquidation value.
          Roth (Cash) net wealth subtracts the external tax cost paid at conversion.
        </div>
      </Card>

      {/* ── Strategy Cards ── */}
      <KPICards results={results} />

      {/* ── What This Means ── */}
      <Card style={{ padding: '18px 22px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>What this means</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {bestStrategy === 'Traditional IRA'
            ? `At a ${Math.round(taxRate * 100)}% combined tax rate, the Roth conversion cost exceeds the benefit of tax-free growth within the ${inputs.endAge - inputs.currentAge}-year window. The Traditional IRA produces better after-tax outcomes under these assumptions.`
            : `Converting to a Roth at age ${inputs.conversionAge} with a ${Math.round(taxRate * 100)}% tax rate costs ${fmtFull(inputs.conversionAmount * taxRate)} upfront${bestStrategy.includes('Cash') ? ' (paid from external cash)' : ' (deducted from the IRA)'}. The Roth's tax-free compounding then overtakes the Traditional${bestBreakeven ? ` at age ${bestBreakeven}` : ''} and builds a ${fmt(advantage)} advantage by age ${inputs.endAge}.`
          }
        </p>
      </Card>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', overflowX: 'auto', paddingBottom: 0 }}>
        {MAIN_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '9px 16px', fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
              border: 'none', borderRadius: '8px 8px 0 0',
              background: activeTab === tab.key ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === tab.key ? 'var(--blue)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--blue)' : '2px solid transparent',
              whiteSpace: 'nowrap', transition: 'all 0.15s', cursor: 'pointer',
            }}
          >
            {tab.label}
            {tab.key === 'crm' && (
              <span style={{
                marginLeft: 5, background: 'var(--blue-dim)', color: 'var(--blue)',
                borderRadius: 8, padding: '1px 6px', fontSize: 10, fontWeight: 600,
              }}>
                {JSON.parse(localStorage.getItem('roth-clients') || '[]').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CHARTS TAB ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Chart view toggle */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CHART_VIEWS.map(cv => (
              <button
                key={cv.key}
                onClick={() => setChartView(cv.key)}
                style={{
                  padding: '6px 14px', fontSize: 12, borderRadius: 20, border: '1px solid',
                  borderColor: chartView === cv.key ? 'var(--blue)' : 'var(--border)',
                  background: chartView === cv.key ? 'var(--blue-dim)' : 'var(--bg-surface)',
                  color: chartView === cv.key ? 'var(--blue)' : 'var(--text-secondary)',
                  fontWeight: chartView === cv.key ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {cv.label}
              </button>
            ))}
          </div>

          {chartView === 'wealth' && (
            <CardSection
              title="After-Tax Wealth"
              sub="Total spendable wealth — Traditional reflects liquidation value; Roth (Cash) shown net of external tax cost"
              cardRef={netWealthRef}
            >
              <NetWealthChart results={results} />
            </CardSection>
          )}
          {chartView === 'balance' && (
            <CardSection title="Account Balance Over Time" sub="Pre-tax account value by year for all three scenarios">
              <AccountValueChart results={results} />
            </CardSection>
          )}
          {chartView === 'taxes' && (
            <CardSection title="Cumulative Taxes Paid" sub="Lifetime tax burden per scenario">
              <CumulativeTaxChart results={results} />
            </CardSection>
          )}
          {chartView === 'rmd' && (
            <CardSection title="RMD Schedule" sub="Traditional IRA required minimum distributions — Roth has none">
              <RMDChart results={results} />
            </CardSection>
          )}
          {chartView === 'breakeven' && (
            <CardSection
              title="Breakeven Analysis"
              sub="Roth after-tax wealth minus Traditional after-tax wealth — positive means Roth is ahead"
              cardRef={breakevenRef}
            >
              <BreakevenChart results={results} />
            </CardSection>
          )}
        </div>
      )}

      {/* ── DISTRIBUTIONS TAB ── */}
      {activeTab === 'distributions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!distInputs.enabled ? (
            <Card style={{
              padding: '48px 24px', textAlign: 'center',
              border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: 13,
            }}>
              Enable Monthly Withdrawals in the left panel to see distribution projections.
            </Card>
          ) : distData ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { label: 'Starting Monthly', value: fmtFull(distInputs.monthlyDistribution), color: 'var(--green)' },
                  { label: 'Total Distributed', value: fmtFull(distData[distData.length - 1].cumulativeDistributions), color: 'var(--blue)' },
                  { label: 'Final Roth Balance', value: fmtFull(distData[distData.length - 1].endBalance), color: 'var(--orange)' },
                ].map(({ label, value, color }) => (
                  <Card key={label} style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--font-mono)', marginTop: 6 }}>{value}</div>
                  </Card>
                ))}
              </div>
              <CardSection
                title="Roth Balance with Systematic Withdrawals"
                sub={`$${distInputs.monthlyDistribution.toLocaleString()}/mo starting at age ${distInputs.distributionStartAge}, growing ${(distInputs.distributionIncreaseRate * 100).toFixed(1)}% annually`}
                cardRef={distRef}
              >
                <CustomDistChart distData={distData} />
              </CardSection>
            </>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Computing…</div>
          )}
        </div>
      )}

      {/* ── MONTE CARLO TAB ── */}
      {activeTab === 'montecarlo' && (
        <CardSection
          title="Monte Carlo Simulation"
          sub={mcResults ? `${mcResults.runs.toLocaleString()} paths · ±12% std dev · bands show P10–P90 and P25–P75` : 'Running simulation…'}
        >
          {mcLoading && (
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Running 1,000 simulations…
            </div>
          )}
          {!mcLoading && mcResults && <MonteCarloChart mcResults={mcResults} />}
        </CardSection>
      )}

      {/* ── DATA TABLE TAB ── */}
      {activeTab === 'table' && (
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Year-by-Year Projection</div>
          <ProjectionTable results={results} />
        </Card>
      )}

      {/* ── MATH GUIDE TAB ── */}
      {activeTab === 'math' && (
        <Card style={{ padding: '28px 32px' }}>
          <GuideTab results={results} distInputs={distInputs} distData={distData} />
        </Card>
      )}

      {/* ── EXPLAINER TAB ── */}
      {activeTab === 'guide' && (
        <Card style={{ padding: '28px 32px' }}>
          <ExplainerTab />
        </Card>
      )}

      {/* ── CRM TAB ── */}
      {activeTab === 'crm' && (
        <Card style={{ padding: 24 }}>
          <CRMTab currentInputs={currentInputs} currentDistInputs={distInputs} onLoadClient={onLoadClient} />
        </Card>
      )}

      {/* ── CLIENT REPORT MODAL ── */}
      {showReportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <Card style={{ padding: 28, width: '100%', maxWidth: 520 }}>
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
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Custom Disclosure (optional)</label>
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
              For best chart quality, visit the <strong>Charts</strong> tab before generating.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
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
                  borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600,
                  cursor: generating ? 'default' : 'pointer',
                }}
              >
                {generating ? 'Generating PDF…' : 'Generate PDF'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
