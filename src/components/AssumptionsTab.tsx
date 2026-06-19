import type { ReactNode } from 'react'
import type { ProjectionResults } from '../engine/types'
import { effectiveTaxRate } from '../engine/calculator'
import { fmtPct } from '../utils/formatters'

interface Props {
  results: ProjectionResults
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--text-muted)', marginBottom: 12, paddingBottom: 6,
        borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'start' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{children}</span>
    </div>
  )
}

function Formula({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue-light)',
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '6px 10px', marginTop: 4,
    }}>
      {text}
    </div>
  )
}

function Disclosure({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)',
      border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px',
      lineHeight: 1.6,
    }}>
      {children}
    </div>
  )
}

export function AssumptionsTab({ results }: Props) {
  const { inputs } = results
  const taxRate = effectiveTaxRate(inputs)

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          Assumptions &amp; Methodology
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          All projections are based on the inputs and assumptions below.
          Results are illustrative and depend on these assumptions remaining constant.
          Real-world outcomes will differ.
        </div>
      </div>

      {/* ── Growth & Timing ── */}
      <Section title="Growth Model">
        <Row label="Return assumption">
          A flat {fmtPct(inputs.growthRate)} annual return is applied uniformly every year.
          No sequence-of-returns variation is modeled in the deterministic projection.
          Monte Carlo applies ±12% standard deviation around this mean.
        </Row>
        <Row label="Withdrawal timing">
          Withdrawals are assumed to occur mid-year. Growth is calculated on the balance
          after removing half the withdrawal, which approximates monthly distributions.
          <Formula text={`Growth = (Beginning Balance − Withdrawal ÷ 2) × ${fmtPct(inputs.growthRate)}`} />
        </Row>
        <Row label="Inflation / COLA">
          Planned distributions increase at the COLA rate you set. All other values
          (balances, tax brackets, RMD divisors) are expressed in nominal dollars.
          No general inflation adjustment is applied.
        </Row>
      </Section>

      {/* ── Tax Treatment ── */}
      <Section title="Tax Treatment">
        <Row label="Effective tax rate">
          All scenarios use a flat combined rate of{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{fmtPct(taxRate)}</strong>{' '}
          (federal {fmtPct(inputs.federalTaxRate)} + state {fmtPct(inputs.stateTaxRate)}, capped at 85%).
          The Tax Bracket Calculator in the left panel estimates graduated federal tax for a specific
          conversion amount and filing status — that estimate is informational only;
          the projections use the flat rate.
        </Row>
        <Row label="Traditional IRA withdrawals">
          All Traditional IRA withdrawals are taxed as ordinary income at the effective rate.
          The remaining Traditional balance is shown as after-tax wealth by multiplying
          the pre-tax balance by (1 − tax rate).
          <Formula text="Traditional ATW = Ending Balance × (1 − Tax Rate) + Cumulative Net Distributions" />
        </Row>
        <Row label="Roth IRA withdrawals">
          Roth withdrawals are modeled as fully tax-free. No Roth IRA owner RMDs are applied
          (current law exempts Roth accounts from lifetime RMDs).
        </Row>
      </Section>

      {/* ── RMD Rules ── */}
      <Section title="Required Minimum Distributions">
        <Row label="RMD calculation">
          RMDs begin at age {inputs.rmdStartAge} and use the IRS Uniform Lifetime Table
          (2022 update, Publication 590-B). Each year's RMD is the prior year-end balance
          divided by the applicable divisor.
        </Row>
        <Row label="Withdrawal floor">
          In the Traditional IRA scenario, the annual withdrawal is the greater of
          the planned distribution target or the RMD, capped by the available balance.
          In Roth scenarios, RMDs are taken from the remaining Traditional balance first.
        </Row>
        <Row label="IRS conversion rule">
          In years where the conversion age equals or exceeds the RMD start age,
          the RMD must be satisfied before any Roth conversion occurs. RMD amounts
          cannot be converted to a Roth IRA.
        </Row>
      </Section>

      {/* ── Scenario Descriptions ── */}
      <Section title="Scenario Definitions">
        <Row label="Scenario A — Traditional IRA">
          No conversion. The full IRA balance grows tax-deferred. All withdrawals are taxable.
          RMDs apply starting at age {inputs.rmdStartAge}.
        </Row>
        <Row label="Scenario B — Roth (Tax from IRA)">
          Converts {fmtPct(Math.min(inputs.conversionAmount, inputs.initialBalance) / inputs.initialBalance)} of the
          balance at age {inputs.conversionAge}. Conversion tax is deducted from the IRA, so the Roth
          starts with a smaller balance. The converted amount minus tax enters the Roth tax-free.
          <Formula text="Initial Roth = Conversion Amount − (Conversion Amount × Tax Rate)" />
        </Row>
        <Row label="Scenario C — Roth (Tax from Cash)">
          Same conversion, but tax is paid from outside cash. The full converted amount
          enters the Roth. Net wealth subtracts the one-time external tax cost.
          <Formula text="Roth C Net Wealth = Roth Balance + Distributions − Cash Tax Paid" />
        </Row>
        <Row label="Scenario D — Roth (IRA Tax + Cash Invested)">
          Tax is paid from the IRA (same as Scenario B). The cash that would have been
          used externally is instead invested in a separate account at the same growth rate.
          That side account is never drawn down for retirement withdrawals.
          <Formula text="Roth D Total = Roth B Wealth + Side Account Balance" />
          <div style={{ marginTop: 8, padding: '7px 10px', background: 'rgba(191,90,242,0.08)', borderRadius: 6, border: '1px solid rgba(191,90,242,0.2)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            The side account is invested separately and not used to fund retirement withdrawals.
            Tax drag on the side account is not currently modeled (see disclosures below).
          </div>
        </Row>
      </Section>

      {/* ── Side Account ── */}
      <Section title="Scenario D — Side Account Details">
        <Row label="Growth rate">
          The side account grows at the same rate as the main portfolio ({fmtPct(inputs.growthRate)}).
          This assumes the outside cash is invested in a similar asset mix.
        </Row>
        <Row label="Starting value">
          Seeded at conversion with the conversion tax amount
          ({fmtPct(taxRate)} × converted balance). Growth applies in the same year the
          account is established (year 0 = conversion year), giving one compounding period
          per projection year including the first.
        </Row>
        <Row label="Withdrawal policy">
          The side account is not used to supplement retirement withdrawals.
          All distributions continue to come from the Roth IRA (and remaining
          Traditional balance, if any). A future toggle to use the side account
          after Roth depletion may be added.
        </Row>
      </Section>

      {/* ── Not Modeled ── */}
      <Section title="Not Currently Modeled">
        <Disclosure>
          <strong>Medicare IRMAA:</strong> Higher taxable income from a Roth conversion can trigger
          surcharges on Medicare Part B and D premiums in the 1–2 years following the conversion.
          This cost is not included in any scenario.
        </Disclosure>
        <Disclosure>
          <strong>Social Security taxation:</strong> Provisional income rules can cause up to 85% of
          Social Security benefits to become taxable. A large conversion in the same year as
          Social Security income may increase the effective tax burden. Not currently modeled.
        </Disclosure>
        <Disclosure>
          <strong>Estate planning &amp; inherited IRA rules:</strong> Roth IRAs pass income-tax-free
          to heirs. Under SECURE 2.0, most non-spouse beneficiaries must deplete inherited IRAs
          within 10 years. These legacy considerations are not included in the projections.
        </Disclosure>
        <Disclosure>
          <strong>Tax drag on side account (Scenario D):</strong> The side account is modeled as a
          tax-free growing asset. In practice, a taxable brokerage account incurs annual taxes on
          dividends and realized gains, which would reduce its after-tax value. A future version
          may include a tax-drag adjustment.
        </Disclosure>
        <Disclosure>
          <strong>State tax variability:</strong> Some states exempt IRA distributions or Roth
          conversions from state income tax. The flat state rate entered is applied uniformly.
        </Disclosure>
        <Disclosure>
          <strong>Bracket changes &amp; future legislation:</strong> All projections use 2025 federal
          tax brackets. Tax law changes (including the scheduled 2026 sunset of TCJA provisions)
          are not modeled.
        </Disclosure>
      </Section>
    </div>
  )
}
