import React from 'react'
import type { ProjectionResults, DistributionInputs, DistYearData } from '../engine/types'
import { effectiveTaxRate } from '../engine/calculator'
import { getRMDDivisor } from '../engine/rmdTable'
import { fmtFull, fmtPct } from '../utils/formatters'

interface Props {
  results: ProjectionResults
  distInputs: DistributionInputs
  distData: DistYearData[] | null
}

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  color: 'var(--blue-light)',
}

const BOX: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '14px 16px',
  marginBottom: 14,
}

function FormulaRow({ label, formula, result, note }: {
  label: string; formula: string; result: string; note?: string
}) {
  return (
    <div style={{ ...BOX, display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 12, alignItems: 'start' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', paddingTop: 1 }}>{label}</span>
      <div>
        <div style={{ ...MONO, color: 'var(--text-muted)', marginBottom: 4 }}>{formula}</div>
        {note && <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{note}</div>}
      </div>
      <div style={{ ...MONO, color: 'var(--green-light)', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
        = {result}
      </div>
    </div>
  )
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 14, marginTop: 28, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  )
}

export function GuideTab({ results, distInputs, distData }: Props) {
  const { inputs, traditional, rothFromIRA, rothFromCash } = results
  const taxRate = effectiveTaxRate(inputs)
  const annualBase = distInputs.monthlyDistribution * 12
  const taxDue = inputs.conversionAmount * taxRate
  const rothBNet = inputs.conversionAmount - taxDue
  const firstRMDAge = inputs.rmdStartAge

  // Find first RMD row
  const firstRMDRow = traditional.find(r => r.rmdAmount > 0)
  const rmdDivisor = firstRMDAge <= inputs.endAge ? getRMDDivisor(firstRMDAge, inputs.rmdStartAge) : 26.5

  // Breakeven row data
  const beRow = results.breakevenC !== null
    ? traditional.find(r => r.age === results.breakevenC)
    : null
  const rothCBeRow = results.breakevenC !== null
    ? rothFromCash.find(r => r.age === results.breakevenC)
    : null

  // Year-2 distribution for COLA example
  const distY2 = annualBase * (1 + distInputs.distributionIncreaseRate)

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>

      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 6 }}>
          Math Verification Guide
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Every formula used in this analyzer, populated with your current inputs.
          Change any assumption in the left panel and these numbers update automatically.
        </p>
      </div>

      {/* ── 1. EFFECTIVE TAX RATE ── */}
      <SectionHead title="1. Effective Tax Rate" sub="Combined federal + state rate, capped at 85%" />
      <FormulaRow
        label="Combined Rate"
        formula={`min(${fmtPct(inputs.federalTaxRate)} federal + ${fmtPct(inputs.stateTaxRate)} state, 85%)`}
        result={fmtPct(taxRate)}
        note="The 85% cap prevents unrealistic scenarios. This rate applies to all ordinary income events: RMDs and Roth conversion tax."
      />

      {/* ── 2. GROWTH FORMULA ── */}
      <SectionHead title="2. Annual Growth Formula" sub="Standard growth vs. mid-year withdrawal assumption" />
      <FormulaRow
        label="Standard (Roth)"
        formula={`endBalance = beginBalance × (1 + ${fmtPct(inputs.growthRate)})`}
        result="No withdrawals — full year earns"
        note="Applied to Roth scenarios: no RMDs, no distributions forcing mid-year adjustments."
      />
      <FormulaRow
        label="Mid-Year (Traditional)"
        formula={`growth = (beginBalance − RMD ÷ 2) × ${fmtPct(inputs.growthRate)}`}
        result="Withdrawals reduce effective earning balance"
        note="IRS RMDs are typically distributed throughout the year, not Jan 1. On average, half the RMD has left the account during the year, reducing the balance that earns returns."
      />
      {firstRMDRow && (
        <FormulaRow
          label={`Age ${firstRMDRow.age} example`}
          formula={`(${fmtFull(firstRMDRow.beginBalance)} − ${fmtFull(firstRMDRow.rmdAmount)} ÷ 2) × ${fmtPct(inputs.growthRate)}`}
          result={fmtFull(firstRMDRow.growth)}
        />
      )}

      {/* ── 3. RMD CALCULATION ── */}
      <SectionHead title="3. Required Minimum Distribution (RMD)" sub="IRS Uniform Lifetime Table — Publication 590-B" />
      <FormulaRow
        label="RMD Formula"
        formula="RMD = Prior Year-End Balance ÷ IRS Divisor"
        result="Mandatory withdrawal"
        note={`RMDs begin at age ${inputs.rmdStartAge} per SECURE 2.0. The divisor decreases each year as life expectancy shortens, forcing larger withdrawals as a % of balance.`}
      />
      {firstRMDRow && (
        <FormulaRow
          label={`Age ${firstRMDAge} (first RMD)`}
          formula={`${fmtFull(traditional[traditional.findIndex(r => r.age === firstRMDAge) - 1]?.endBalance ?? 0)} ÷ ${rmdDivisor}`}
          result={fmtFull(firstRMDRow.rmdAmount)}
          note="Prior year-end balance is used as the RMD base, consistent with IRS rules."
        />
      )}
      <FormulaRow
        label="After-Tax RMD"
        formula={`netDistribution = RMD × (1 − ${fmtPct(taxRate)})`}
        result={firstRMDRow ? fmtFull(firstRMDRow.netDistribution) : 'N/A'}
        note="Only the net (after-tax) distribution increases spendable wealth."
      />

      {/* ── 4. ROTH CONVERSION MATH ── */}
      <SectionHead title="4. Roth Conversion Math" sub="How the two Roth scenarios differ at conversion age" />
      <FormulaRow
        label="Tax Due"
        formula={`${fmtFull(inputs.conversionAmount)} × ${fmtPct(taxRate)}`}
        result={fmtFull(taxDue)}
        note="Conversion amount is treated as ordinary income in the year of conversion."
      />
      <FormulaRow
        label="Scenario B — Tax from IRA"
        formula={`Roth starts with: ${fmtFull(inputs.conversionAmount)} − ${fmtFull(taxDue)}`}
        result={fmtFull(rothBNet)}
        note="The tax withholding reduces the initial Roth balance. Less money compounds going forward."
      />
      <FormulaRow
        label="Scenario C — Tax from Cash"
        formula={`Roth starts with: full ${fmtFull(inputs.conversionAmount)} (tax paid externally)`}
        result={fmtFull(inputs.conversionAmount)}
        note="Full conversion amount enters the Roth. External tax = real cash cost, tracked as a sunk cost."
      />

      {/* ── 5. AFTER-TAX WEALTH ── */}
      <SectionHead title="5. After-Tax Wealth Comparison" sub="How we calculate true spendable wealth for each scenario" />
      <FormulaRow
        label="Traditional IRA"
        formula={`afterTaxWealth = endBalance × (1 − ${fmtPct(taxRate)}) + cumulativeNetDistributions`}
        result="Liquidation value + distributions"
        note="The remaining IRA balance is pre-tax and still owes taxes on withdrawal. We apply the effective tax rate to get its true spendable value, then add all net distributions already received."
      />
      <FormulaRow
        label="Roth B (Tax from IRA)"
        formula="afterTaxWealth = rothBalance + tradBalance × (1 − taxRate) + cumulativeNetDist"
        result="Roth is after-tax; any remaining Traditional is tax-adjusted"
        note="If a partial conversion leaves a remaining Traditional balance, that balance is discounted by the tax rate. The Roth portion needs no discount."
      />
      <FormulaRow
        label="Roth C Gross (Tax from Cash)"
        formula="afterTaxWealthGross = rothBalance + tradBalance × (1 − taxRate) + cumulativeNetDist"
        result="Same formula as Roth B before netting out cash cost"
        note="Gross wealth does not account for the external cash paid to fund the conversion tax."
      />
      <FormulaRow
        label="Roth C Net (Tax from Cash)"
        formula={`afterTaxWealth = gross − ${fmtFull(inputs.conversionAmount * taxRate)}`}
        result="Net of external tax cost"
        note="The cash used to pay conversion tax came from outside the account. Subtracting it gives a fair apples-to-apples comparison against Traditional — both strategies started with the same total resources."
      />
      {beRow && rothCBeRow && (
        <FormulaRow
          label={`At breakeven (age ${results.breakevenC})`}
          formula={`Trad: ${fmtFull(beRow.afterTaxWealth)}  vs  Roth C net: ${fmtFull(rothCBeRow.afterTaxWealth)}`}
          result="Roth first exceeds Traditional"
          note="This is the first year Roth (Cash) net after-tax wealth surpasses the corrected Traditional value. Both figures reflect true liquidation value."
        />
      )}

      {/* ── 6. DISTRIBUTION WITH COLA ── */}
      <SectionHead title="6. Systematic Distribution with COLA" sub="Monthly distribution compounded annually" />
      <FormulaRow
        label="Annual base"
        formula={`${fmtFull(distInputs.monthlyDistribution)}/month × 12`}
        result={fmtFull(annualBase)}
      />
      <FormulaRow
        label="Year N distribution"
        formula={`${fmtFull(annualBase)} × (1 + ${fmtPct(distInputs.distributionIncreaseRate)})^years`}
        result={`Year 2: ${fmtFull(distY2)}, Year 10: ${fmtFull(annualBase * Math.pow(1 + distInputs.distributionIncreaseRate, 9))}`}
        note={`COLA increases the distribution by ${fmtPct(distInputs.distributionIncreaseRate)} each year to help maintain purchasing power against inflation.`}
      />
      <FormulaRow
        label="Mid-year growth (Roth)"
        formula={`(beginBalance − annualDist ÷ 2) × ${fmtPct(inputs.growthRate)}`}
        result="Distributions reduce mid-year earning balance"
        note="Same mid-year assumption as Traditional RMDs — distributions are taken throughout the year, so on average half has left the account."
      />
      {distData?.[0] && (
        <FormulaRow
          label={`Age ${distInputs.distributionStartAge} (year 1)`}
          formula={`(${fmtFull(distData[0].beginBalance)} − ${fmtFull(distData[0].annualDistribution)} ÷ 2) × ${fmtPct(inputs.growthRate)}`}
          result={fmtFull(distData[0].growth)}
        />
      )}

      {/* ── 7. MONTE CARLO ── */}
      <SectionHead title="7. Monte Carlo Method" sub="1,000 simulations using Box-Muller normal random returns" />
      <FormulaRow
        label="Random return"
        formula={`r = max(−50%, ${fmtPct(inputs.growthRate)} + 12% × Z)`}
        result="Z ~ N(0,1) each year"
        note="Box-Muller transform generates standard normal random variable Z. Returns are floored at −50% to prevent unrealistic total-loss events."
      />
      <FormulaRow
        label="Box-Muller"
        formula="Z = √(−2 ln U₁) × cos(2π U₂)   where U₁, U₂ ~ Uniform(0,1)"
        result="Exact normal distribution"
        note="Produces a perfectly normal distribution from two uniform random variables. Used for each year's simulated return."
      />
      <FormulaRow
        label="Percentile bands"
        formula="P10/P25/P50/P75/P90 from sorted array of 1,000 end-of-year balances"
        result="1,000 runs × 36 years = 36,000 data points"
        note="The shaded band on the chart shows P10–P90 (80% of outcomes). The median line (P50) is the typical scenario. Wider bands at later ages reflect compounding uncertainty."
      />

      {/* Footer */}
      <div style={{
        marginTop: 28, padding: '12px 16px',
        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7,
      }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Data sources:</strong> IRS Publication 590-B (Uniform Lifetime Table) · SECURE 2.0 Act (2022) ·
        Box-Muller transform (1958) · Mid-year withdrawal convention (standard actuarial practice)
      </div>
    </div>
  )
}
