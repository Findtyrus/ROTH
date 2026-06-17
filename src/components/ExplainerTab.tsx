import React, { useState } from 'react'

interface SectionProps {
  icon: string
  title: string
  color: 'blue' | 'orange' | 'green' | 'purple' | 'red'
  children: React.ReactNode
  defaultOpen?: boolean
}

const COLOR = {
  blue:   { border: 'var(--blue)',   bg: 'var(--blue-dim)',              text: 'var(--blue-light)' },
  orange: { border: 'var(--orange)', bg: 'var(--orange-dim)',            text: 'var(--orange-light)' },
  green:  { border: 'var(--green)',  bg: 'var(--green-dim)',             text: 'var(--green-light)' },
  purple: { border: 'var(--purple)', bg: 'rgba(139,92,246,0.12)',        text: '#a78bfa' },
  red:    { border: 'var(--red)',    bg: 'rgba(239,68,68,0.12)',         text: '#f87171' },
}

function AccordionSection({ icon, title, color, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const c = COLOR[color]

  return (
    <div style={{
      border: `1px solid ${c.border}`,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: c.bg,
          border: 'none', padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: c.text, flex: 1 }}>{title}</span>
        <span style={{ color: c.text, opacity: 0.7, fontSize: 16, fontWeight: 300 }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{
          padding: '16px 18px 18px',
          background: 'var(--bg-surface)',
          borderTop: `1px solid ${c.border}`,
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12,
      padding: '8px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{children}</span>
    </div>
  )
}

function Tag({ children, color = 'blue' }: { children: React.ReactNode; color?: keyof typeof COLOR }) {
  const c = COLOR[color]
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      background: c.bg, color: c.text, fontSize: 11, fontWeight: 600,
      border: `1px solid ${c.border}`, marginRight: 6, marginTop: 2,
    }}>
      {children}
    </span>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 10 }}>{children}</p>
}

function Callout({ children, color = 'blue' }: { children: React.ReactNode; color?: keyof typeof COLOR }) {
  const c = COLOR[color]
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 'var(--radius-md)', marginTop: 10,
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: 12, color: c.text, lineHeight: 1.6,
    }}>
      {children}
    </div>
  )
}

export function ExplainerTab() {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 8 }}>
          How This Analyzer Works
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          This tool models three distinct retirement account strategies side-by-side across your full projection horizon.
          Adjust any assumption in the left panel and every chart updates instantly. All calculations run entirely in your browser — no data leaves your device.
        </p>
      </div>

      {/* ── THE THREE SCENARIOS ── */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        The Three Scenarios
      </div>

      <AccordionSection icon="🔵" title="Scenario A — Traditional IRA (Hold)" color="blue" defaultOpen>
        <P>
          Your money stays in the Traditional IRA and grows tax-deferred. No action is taken at the conversion age.
          Once you reach the RMD start age (default 73, per SECURE 2.0), the IRS requires you to withdraw a minimum
          amount each year based on your account balance and life expectancy divisor from the Uniform Lifetime Table.
        </P>
        <div style={{ marginBottom: 8 }}>
          <Row label="Growth">Pre-tax, compounded annually at your selected rate</Row>
          <Row label="RMDs">Begin at your RMD start age; each year's amount = prior year-end balance ÷ IRS divisor</Row>
          <Row label="Taxes">Applied to each RMD at your combined federal + state rate</Row>
          <Row label="After-Tax Wealth">Account balance + cumulative net (after-tax) distributions received</Row>
        </div>
        <Callout color="blue">
          The Traditional IRA is the baseline. Every other scenario is measured against it.
          A higher after-tax wealth means the conversion beat doing nothing.
        </Callout>
      </AccordionSection>

      <AccordionSection icon="🟠" title="Scenario B — Roth Conversion (Tax Paid from IRA)" color="orange">
        <P>
          At your chosen conversion age, you convert the full conversion amount to a Roth IRA.
          The tax bill is paid by withholding from the converted funds — meaning a smaller amount
          actually ends up in the Roth.
        </P>
        <div style={{ marginBottom: 8 }}>
          <Row label="Conversion">Tax = conversionAmount × combined rate; Roth receives the remainder</Row>
          <Row label="Example">$2M at 37% → $740K tax withheld → $1.26M enters Roth</Row>
          <Row label="After conversion">Roth grows tax-free, no RMDs, no future distributions taxed</Row>
          <Row label="After-Tax Wealth">Simply the Roth balance (all wealth is already after-tax)</Row>
        </div>
        <Callout color="orange">
          This is the more conservative Roth scenario — you lose compound growth on the tax dollars paid.
          It typically breaks even later than Scenario C, but still avoids all future RMDs and taxes.
        </Callout>
      </AccordionSection>

      <AccordionSection icon="🟢" title="Scenario C — Roth Conversion (Tax Paid from Cash)" color="green">
        <P>
          Same conversion, but the tax bill is paid from an outside cash account rather than the IRA.
          The full conversion amount enters the Roth, so the Roth starts larger than in Scenario B.
          The external tax cost is tracked separately as a sunk cost.
        </P>
        <div style={{ marginBottom: 8 }}>
          <Row label="Conversion">Full conversionAmount enters the Roth; tax paid from savings/checking</Row>
          <Row label="Example">$2M at 37% → $740K paid from cash → $2M enters Roth</Row>
          <Row label="After conversion">Roth grows tax-free, no RMDs, no future distributions taxed</Row>
          <Row label="After-Tax Wealth">Roth balance (external tax cost is a real out-of-pocket cost but not deducted here)</Row>
        </div>
        <Callout color="green">
          This is the most powerful scenario if you have outside funds to cover the tax bill.
          The compounding advantage of a larger Roth balance typically produces the highest long-term wealth —
          and the fastest breakeven — of all three strategies.
        </Callout>
      </AccordionSection>

      {/* ── CHARTS ── */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, marginTop: 28 }}>
        Charts Explained
      </div>

      <AccordionSection icon="📈" title="Account Value — Pre-Tax Account Balance" color="blue">
        <P>
          Shows the raw account balance (before any taxes are applied) for all three scenarios at each age.
          For the Traditional IRA, this balance shrinks over time as RMDs are withdrawn.
          For Roth scenarios, the balance grows uninterrupted because there are no mandatory withdrawals.
        </P>
        <Callout color="blue">
          This chart can be misleading on its own: a higher Traditional balance doesn't mean more wealth,
          because it's pre-tax. Use <strong>After-Tax Wealth</strong> for a true apples-to-apples comparison.
        </Callout>
      </AccordionSection>

      <AccordionSection icon="💰" title="After-Tax Wealth — True Spendable Wealth" color="green">
        <P>
          The most important chart. For the Traditional IRA, after-tax wealth = account balance +
          cumulative net distributions (RMDs already taxed and pocketed). For Roth scenarios, all wealth is
          already after-tax, so after-tax wealth = the account balance itself.
        </P>
        <P>
          The crossover points — where a Roth line rises above the Traditional line — are the breakeven ages.
          Before the breakeven, the Traditional IRA holds more spendable wealth. After it, the Roth wins.
        </P>
        <Callout color="green">
          Roth conversions are almost always advantageous over a long enough horizon. The key question
          is whether you'll live past the breakeven age — and by how much.
        </Callout>
      </AccordionSection>

      <AccordionSection icon="🧾" title="Cumulative Tax — Lifetime Tax Burden" color="red">
        <P>
          Shows the running total of all taxes paid under each scenario across your lifetime.
          For Traditional IRA: taxes accumulate gradually as RMDs are taken each year.
          For Roth scenarios: all tax is paid upfront at conversion, so the lines are flat after year one.
        </P>
        <Callout color="red">
          This chart often surprises people. Even though the Roth requires a large upfront tax payment,
          the Traditional IRA can end up costing significantly more in total taxes over a long retirement —
          especially at high balances where RMDs compound into larger and larger withdrawals.
        </Callout>
      </AccordionSection>

      <AccordionSection icon="📊" title="RMD Schedule — Required Minimum Distributions" color="blue">
        <P>
          Applies to the Traditional IRA only. Shows the gross RMD (blue bars) and the net after-tax amount
          you actually receive (green bars) for each year RMDs are required.
        </P>
        <div style={{ marginBottom: 8 }}>
          <Row label="Formula">RMD = prior year-end balance ÷ IRS Uniform Lifetime Table divisor</Row>
          <Row label="Start age">Configurable (default 73 per SECURE 2.0)</Row>
          <Row label="Key insight">RMDs grow over time as the divisor shrinks with age, even as the balance falls</Row>
        </div>
        <Callout color="blue">
          Roth IRAs have no RMDs during the owner's lifetime, which is one of their most powerful estate-planning advantages.
          Large RMDs can also push you into higher tax brackets or trigger IRMAA Medicare surcharges — costs not modeled here.
        </Callout>
      </AccordionSection>

      <AccordionSection icon="⚖️" title="Breakeven — When Roth Overtakes Traditional" color="purple">
        <P>
          Plots the dollar difference between each Roth scenario and the Traditional IRA (Roth − Traditional).
          When the line crosses zero from below, the Roth has overtaken the Traditional in after-tax wealth —
          that's the breakeven age shown in the KPI card.
        </P>
        <P>
          Values above the zero line: the Roth is ahead. Values below: the Traditional still leads.
          The steeper the slope after crossing, the more valuable the Roth becomes with each passing year.
        </P>
        <Callout color="purple">
          A breakeven at age 78 means: if you live to 78, both strategies delivered equal wealth.
          Every year beyond that, the Roth compounds an increasing advantage. If no crossover is shown,
          the Traditional IRA wins across the full projection range — typically at very short horizons or low tax rates.
        </Callout>
      </AccordionSection>

      <AccordionSection icon="🎲" title="Monte Carlo — Stress-Testing the Projection" color="orange">
        <P>
          The deterministic charts above use a fixed annual return. Monte Carlo adds realism by simulating
          1,000 different market paths using a normal distribution of returns with the same mean but ±12%
          standard deviation (roughly consistent with historical U.S. equity volatility).
        </P>
        <div style={{ marginBottom: 8 }}>
          <Row label="Runs">1,000 independent simulations per scenario</Row>
          <Row label="Return model">mean = your growth rate setting; σ = 12%; floored at −50%</Row>
          <Row label="Bands">Outer band = P10–P90 (80% of outcomes); inner band = P25–P75 (middle 50%); line = median (P50)</Row>
        </div>
        <Callout color="orange">
          If the Roth's P50 line consistently leads the Traditional's P50, the conversion is advantageous
          in the median scenario. Wider bands at older ages reflect the compounding uncertainty over longer horizons.
          This chart is recalculated each time you change an assumption.
        </Callout>
      </AccordionSection>

      <AccordionSection icon="📋" title="Data Table — Year-by-Year Detail" color="blue">
        <P>
          A scrollable ledger showing every computed value for every year of the projection.
          Use the tab filters (Traditional / Roth B / Roth C / All) to focus on one scenario.
          Rows highlighted in blue indicate years when an RMD is required.
        </P>
        <Callout color="blue">
          Use CSV export (top-right button) to pull this data into Excel or a financial model for further analysis.
        </Callout>
      </AccordionSection>

      {/* ── ASSUMPTIONS ── */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, marginTop: 28 }}>
        Assumption Panel Reference
      </div>

      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 12,
      }}>
        <div style={{ padding: '10px 0', margin: '0 18px' }}>
          <Row label="Current Age">Your age today. The projection begins here.</Row>
          <Row label="End Age">How far to project. Longer horizons generally favor Roth conversion.</Row>
          <Row label="Initial IRA Balance">Pre-tax balance in your Traditional IRA today.</Row>
          <Row label="Annual Growth Rate">Assumed average annual return, applied uniformly each year (deterministic model). Monte Carlo varies this.</Row>
          <Row label="Inflation Rate">Currently informational — displayed but not applied to deflate real values. Set to 0 for nominal projections.</Row>
          <Row label="Federal Tax Rate">Your marginal federal income tax rate at the time of conversion. Applies to both the conversion event and future RMDs.</Row>
          <Row label="State Tax Rate">Your state marginal rate. Combined with federal (capped at 85% total) for the effective rate.</Row>
          <Row label="Capital Gains Rate">Not currently applied to IRA projections (IRA distributions are ordinary income). Reserved for future taxable account modeling.</Row>
          <Row label="RMD Start Age">Age at which RMDs begin. SECURE 2.0 (2023) raised this to 73; scheduled to rise to 75 in 2033.</Row>
          <Row label="Conversion Amount">The dollar amount converted to Roth. Default equals the full Initial Balance for a complete conversion analysis.</Row>
          <Row label="Conversion Age">Age at which the conversion occurs. Must be ≥ your current age. Earlier conversions maximize Roth compounding time.</Row>
        </div>
      </div>

      {/* ── LIMITATIONS ── */}
      <AccordionSection icon="⚠️" title="Important Limitations & Disclaimers" color="red">
        <P>This tool is designed for educational illustration, not personalized tax or financial advice. Key simplifications:</P>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {[
            ['No bracket modeling', 'A flat marginal rate is applied to all conversions and RMDs. In reality, a large conversion may push income across multiple brackets.'],
            ['No Social Security / Medicare', 'RMDs can trigger IRMAA surcharges and increase Social Security taxation — not modeled here.'],
            ['No state-specific rules', 'Some states exempt IRA distributions from state tax; some don\'t. Verify your state rules.'],
            ['Inflation not deflated', 'All values are in nominal (future) dollars. Real purchasing power will be lower.'],
            ['Single conversion event', 'Partial or multi-year conversions (a common strategy for bracket management) are not modeled.'],
            ['Fixed return rate', 'The deterministic model uses a constant rate. The Monte Carlo tab provides a more realistic range.'],
            ['Estate planning ignored', 'Roth IRAs have significant estate advantages (no RMDs for heirs under SECURE 2.0). Not captured here.'],
          ].map(([label, desc]) => (
            <div key={label} style={{ display: 'flex', gap: 10, fontSize: 12, lineHeight: 1.6 }}>
              <span style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }}>•</span>
              <span><strong style={{ color: 'var(--text-secondary)' }}>{label}:</strong>{' '}
                <span style={{ color: 'var(--text-muted)' }}>{desc}</span>
              </span>
            </div>
          ))}
        </div>
        <Callout color="red">
          Always consult a CPA or CFP before executing a Roth conversion. The optimal strategy depends heavily
          on your current and projected future tax brackets, state of residence, estate goals, and liquidity.
        </Callout>
      </AccordionSection>

      {/* Footer */}
      <div style={{
        marginTop: 24, padding: '14px 18px',
        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        display: 'flex', flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Data sources:</span>
        <Tag color="blue">IRS Uniform Lifetime Table (Pub. 590-B)</Tag>
        <Tag color="blue">SECURE 2.0 Act (2022)</Tag>
        <Tag color="green">All calculations run client-side</Tag>
        <Tag color="purple">No financial data stored or transmitted</Tag>
      </div>
    </div>
  )
}
