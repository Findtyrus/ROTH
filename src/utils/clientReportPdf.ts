import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import type { ProjectionResults, DistYearData, ReportMeta } from '../engine/types'
import { fmtFull, fmtPct } from './formatters'

// ── Design tokens ────────────────────────────────────────────────────
const NAVY   = [15, 23, 42]   as [number, number, number]
const BLUE   = [59, 130, 246] as [number, number, number]
const GREEN  = [16, 185, 129] as [number, number, number]
const ORANGE = [245, 158, 11] as [number, number, number]
const SLATE  = [100, 116, 139]as [number, number, number]
const WHITE  = [255, 255, 255]as [number, number, number]
const LIGHT  = [248, 250, 252]as [number, number, number]
const DARK   = [30, 41, 59]   as [number, number, number]

const W = 216  // letter width mm
const H = 279  // letter height mm
const MARGIN = 18

// ── Helpers ───────────────────────────────────────────────────────────
let pageNumber = 0

function newPage(doc: jsPDF) {
  pageNumber++
  if (pageNumber > 1) doc.addPage()
}

function addPageNumber(doc: jsPDF) {
  doc.setFontSize(9)
  doc.setTextColor(...SLATE)
  doc.text(`Page ${pageNumber}`, W - MARGIN, H - 10, { align: 'right' })
}

function addFooter(doc: jsPDF, meta: ReportMeta) {
  const y = H - 14
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, W - MARGIN, y)
  doc.setFontSize(8)
  doc.setTextColor(...SLATE)
  if (meta.firmName) doc.text(meta.firmName, MARGIN, y + 5)
  if (meta.advisorName) doc.text(`Prepared by: ${meta.advisorName}`, W / 2, y + 5, { align: 'center' })
  doc.text(`Page ${pageNumber}`, W - MARGIN, y + 5, { align: 'right' })
}

function sectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...BLUE)
  doc.roundedRect(MARGIN, y, W - MARGIN * 2, 10, 2, 2, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...WHITE)
  doc.text(title.toUpperCase(), MARGIN + 6, y + 7)
  return y + 16
}

function calloutBox(
  doc: jsPDF,
  label: string,
  value: string,
  sub: string,
  x: number, y: number, w: number,
  color: [number, number, number],
): void {
  doc.setFillColor(color[0], color[1], color[2], 0.08 as any)
  doc.setFillColor(Math.min(255, color[0] + 190), Math.min(255, color[1] + 190), Math.min(255, color[2] + 190))
  doc.roundedRect(x, y, w, 28, 3, 3, 'F')
  doc.setDrawColor(...color)
  doc.setLineWidth(0.5)
  doc.roundedRect(x, y, w, 28, 3, 3, 'S')
  // Top accent line
  doc.setFillColor(...color)
  doc.roundedRect(x, y, w, 2, 1, 1, 'F')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...SLATE)
  doc.text(label, x + w / 2, y + 9, { align: 'center' })
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text(value, x + w / 2, y + 19, { align: 'center' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...SLATE)
  doc.text(sub, x + w / 2, y + 25, { align: 'center' })
}

async function captureChart(ref: HTMLElement | null): Promise<string | null> {
  if (!ref) return null
  try {
    const canvas = await html2canvas(ref, {
      backgroundColor: '#111827',
      scale: 2,
      logging: false,
      useCORS: true,
    })
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

// ── Main export ───────────────────────────────────────────────────────
export async function generateClientReport(
  results: ProjectionResults,
  distData: DistYearData[] | null,
  meta: ReportMeta,
  chartRefs: {
    netWealth: HTMLElement | null
    breakeven: HTMLElement | null
    customDist: HTMLElement | null
  },
): Promise<void> {
  const { traditional, rothFromIRA, rothFromCash, inputs, breakevenB, breakevenC } = results
  const lastTrad = traditional[traditional.length - 1]
  const lastRothB = rothFromIRA[rothFromIRA.length - 1]
  const lastRothC = rothFromCash[rothFromCash.length - 1]
  const taxRate = Math.min(inputs.federalTaxRate + inputs.stateTaxRate, 0.85)

  pageNumber = 0
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

  // Pre-capture charts
  const [wealthImg, breakevenImg, distImg] = await Promise.all([
    captureChart(chartRefs.netWealth),
    captureChart(chartRefs.breakeven),
    captureChart(chartRefs.customDist),
  ])

  // ── PAGE 1: COVER ─────────────────────────────────────────────────
  newPage(doc)

  // Full-width navy header band
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 80, 'F')

  // Blue accent bar
  doc.setFillColor(...BLUE)
  doc.rect(0, 76, W, 4, 'F')

  // Title block
  doc.setTextColor(...WHITE)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.text('Roth Conversion', MARGIN, 36)
  doc.text('Analysis', MARGIN, 50)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('Retirement Income Strategy Report', MARGIN, 62)

  // Client info block
  doc.setFillColor(...LIGHT)
  doc.roundedRect(MARGIN, 90, W - MARGIN * 2, 50, 4, 4, 'F')
  doc.setFillColor(...BLUE)
  doc.roundedRect(MARGIN, 90, 4, 50, 2, 2, 'F')

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text(meta.clientName || 'Client', MARGIN + 10, 108)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...SLATE)
  doc.text(`Prepared: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, MARGIN + 10, 118)
  if (meta.advisorName) doc.text(`Advisor: ${meta.advisorName}`, MARGIN + 10, 126)
  if (meta.firmName) doc.text(meta.firmName, MARGIN + 10, 133)

  // Scope summary boxes
  const scopeY = 152
  const boxW = (W - MARGIN * 2 - 8) / 4

  ;[
    ['Initial Balance', fmtFull(inputs.initialBalance), ''],
    ['Projection Horizon', `Ages ${inputs.currentAge}–${inputs.endAge}`, `${inputs.endAge - inputs.currentAge} years`],
    ['Growth Rate', fmtPct(inputs.growthRate), 'Annual assumed return'],
    ['Tax Rate', fmtPct(taxRate), 'Combined federal + state'],
  ].forEach(([label, val, sub], i) => {
    calloutBox(doc, label, val, sub, MARGIN + i * (boxW + 2.7), scopeY, boxW, BLUE)
  })

  // Disclosure teaser
  doc.setFontSize(8)
  doc.setTextColor(...SLATE)
  const discY = 200
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(MARGIN, discY, W - MARGIN * 2, 22, 3, 3, 'F')
  doc.text(
    'This report is prepared for educational and planning purposes only. It is not tax advice or a guarantee of future results.',
    MARGIN + 4, discY + 7
  )
  doc.text(
    'Past performance is not indicative of future results. Consult a qualified CPA or CFP before taking action.',
    MARGIN + 4, discY + 13
  )

  addFooter(doc, meta)

  // ── PAGE 2: EXECUTIVE SUMMARY ─────────────────────────────────────
  newPage(doc)
  let y = MARGIN

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...NAVY)
  doc.text('Executive Summary', MARGIN, y + 8)
  y += 18

  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, W - MARGIN, y)
  y += 10

  // Narrative paragraph
  const bestFinal = Math.max(lastTrad.afterTaxWealth, lastRothB.afterTaxWealth, lastRothC.afterTaxWealth)
  const bestLabel = bestFinal === lastRothC.afterTaxWealth ? 'Roth Conversion (Tax from Cash)'
    : bestFinal === lastRothB.afterTaxWealth ? 'Roth Conversion (Tax from IRA)'
    : 'Traditional IRA'
  const advantage = lastRothC.afterTaxWealth - lastTrad.afterTaxWealth
  const advantagePct = lastTrad.afterTaxWealth > 0
    ? ((advantage / lastTrad.afterTaxWealth) * 100).toFixed(1)
    : '0.0'

  const narrative = [
    `This analysis projects the after-tax wealth outcomes of three retirement strategies for ${meta.clientName || 'the client'} over a ${inputs.endAge - inputs.currentAge}-year horizon, from age ${inputs.currentAge} to age ${inputs.endAge}.`,
    '',
    `Beginning with an IRA balance of ${fmtFull(inputs.initialBalance)} and assuming an annual growth rate of ${fmtPct(inputs.growthRate)}, the analysis models: (1) maintaining the Traditional IRA with mandatory Required Minimum Distributions beginning at age ${inputs.rmdStartAge}, (2) converting ${fmtFull(inputs.conversionAmount)} to a Roth IRA at age ${inputs.conversionAge} with the tax liability paid from IRA proceeds, and (3) the same conversion with tax paid from an external source.`,
    '',
    `At the assumed combined federal and state tax rate of ${fmtPct(taxRate)}, the projected tax due on conversion is ${fmtFull(inputs.conversionAmount * taxRate)}. Under the optimal strategy (${bestLabel}), the projected after-tax wealth at age ${inputs.endAge} is ${fmtFull(bestFinal)}, representing a ${advantagePct}% ${advantage >= 0 ? 'improvement over' : 'difference from'} the Traditional IRA baseline of ${fmtFull(lastTrad.afterTaxWealth)}.`,
    '',
    breakevenC
      ? `The Roth Conversion (Tax from Cash) strategy is projected to surpass the Traditional IRA in total after-tax wealth at age ${breakevenC}, providing an increasing advantage of ${fmtFull(Math.abs(advantage))} by age ${inputs.endAge}.`
      : 'Based on the current assumptions, the Traditional IRA maintains a wealth advantage through the end of the projection period. Consider adjusting the tax rate, growth rate, or projection horizon.',
  ]

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK)
  let textY = y
  for (const line of narrative) {
    if (line === '') { textY += 4; continue }
    const split = doc.splitTextToSize(line, W - MARGIN * 2)
    doc.text(split, MARGIN, textY)
    textY += split.length * 5.5
  }
  y = textY + 6

  // 4 KPI callout boxes
  const kpiW = (W - MARGIN * 2 - 9) / 4
  ;[
    [lastTrad.afterTaxWealth, 'Traditional Final Wealth', `${fmtFull(lastTrad.cumulativeTaxes)} total tax paid`, BLUE],
    [lastRothB.afterTaxWealth, 'Roth B Final Wealth', 'Tax paid from IRA', ORANGE],
    [lastRothC.afterTaxWealth, 'Roth C Final Wealth', 'Tax paid from cash', GREEN],
    [breakevenC ?? breakevenB ?? 0, 'Breakeven Age', breakevenC ? 'Roth C overtakes Trad.' : breakevenB ? 'Roth B overtakes Trad.' : 'No crossover in range', [139, 92, 246] as [number, number, number]],
  ].forEach(([val, label, sub, color], i) => {
    const displayVal = i < 3 ? fmtFull(val as number) : val ? `Age ${val}` : 'N/A'
    calloutBox(doc, label as string, displayVal, sub as string, MARGIN + i * (kpiW + 3), y, kpiW, color as [number, number, number])
  })
  y += 38

  // Net wealth chart
  if (wealthImg) {
    y = sectionHeader(doc, 'After-Tax Wealth Comparison', y)
    doc.addImage(wealthImg, 'PNG', MARGIN, y, W - MARGIN * 2, 70)
    y += 76
  }

  addFooter(doc, meta)

  // ── PAGE 3: BREAKEVEN & ASSUMPTIONS ───────────────────────────────
  newPage(doc)
  y = MARGIN

  if (breakevenImg) {
    y = sectionHeader(doc, 'Breakeven Analysis', y)
    doc.addImage(breakevenImg, 'PNG', MARGIN, y, W - MARGIN * 2, 70)
    y += 78

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SLATE)
    const beText = breakevenC
      ? `The chart above shows the dollar advantage of each Roth conversion scenario relative to the Traditional IRA. Values above zero indicate the Roth strategy is ahead in after-tax wealth. The Roth (Tax from Cash) strategy crosses into positive territory at age ${breakevenC}, and the Roth (Tax from IRA) strategy crosses at age ${breakevenB ?? 'N/A'}.`
      : 'Under the current assumptions, neither Roth conversion scenario overtakes the Traditional IRA within the projection horizon. The chart shows how close each scenario comes to the breakeven threshold.'
    const beSplit = doc.splitTextToSize(beText, W - MARGIN * 2)
    doc.text(beSplit, MARGIN, y)
    y += beSplit.length * 5.5 + 10
  }

  y = sectionHeader(doc, 'Assumptions & Parameters', y)
  autoTable(doc, {
    startY: y,
    head: [['Parameter', 'Value', 'Notes']],
    body: [
      ['Initial IRA Balance', fmtFull(inputs.initialBalance), 'Pre-tax Traditional IRA balance at start of projection'],
      ['Annual Growth Rate', fmtPct(inputs.growthRate), 'Assumed average annual return (pre-tax, pre-distribution)'],
      ['Federal Tax Rate', fmtPct(inputs.federalTaxRate), 'Marginal federal income tax rate applied at conversion and to RMDs'],
      ['State Tax Rate', fmtPct(inputs.stateTaxRate), 'State marginal rate; combined rate capped at 85%'],
      ['Combined Effective Rate', fmtPct(taxRate), 'Federal + State, applied to conversion and RMDs'],
      ['RMD Start Age', `${inputs.rmdStartAge}`, 'Per SECURE 2.0 Act (2022); scheduled to increase to 75 in 2033'],
      ['Conversion Amount', fmtFull(inputs.conversionAmount), 'Amount converted to Roth IRA'],
      ['Conversion Age', `${inputs.conversionAge}`, 'Age at which the conversion is executed'],
      ['Projection Start Age', `${inputs.currentAge}`, ''],
      ['Projection End Age', `${inputs.endAge}`, `${inputs.endAge - inputs.currentAge}-year horizon`],
      ['Inflation Rate', fmtPct(inputs.inflationRate), 'Informational only; all values shown in nominal dollars'],
      ['Growth Formula', 'Mid-Year Withdrawal Assumption', '(Begin − Withdrawal/2) × Rate; reflects intra-year distributions'],
    ],
    headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 48 }, 2: { textColor: SLATE, fontSize: 8 } },
    margin: { left: MARGIN, right: MARGIN },
  })
  y = (doc as any).lastAutoTable.finalY + 6
  addFooter(doc, meta)

  // ── PAGE 4: SCENARIO COMPARISON TABLE ─────────────────────────────
  newPage(doc)
  y = MARGIN
  y = sectionHeader(doc, 'Scenario Comparison', y)

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Traditional IRA', 'Roth (Tax from IRA)', 'Roth (Tax from Cash)']],
    body: [
      ['Final Account Balance', fmtFull(lastTrad.endBalance), fmtFull(lastRothB.endBalance), fmtFull(lastRothC.endBalance)],
      ['Total Taxes Paid', fmtFull(lastTrad.cumulativeTaxes), fmtFull(lastRothB.cumulativeTaxesPaid), fmtFull(lastRothC.cumulativeTaxesPaid)],
      ['After-Tax Wealth', fmtFull(lastTrad.afterTaxWealth), fmtFull(lastRothB.afterTaxWealth), fmtFull(lastRothC.afterTaxWealth)],
      ['vs. Traditional', 'Baseline', fmtFull(lastRothB.afterTaxWealth - lastTrad.afterTaxWealth), fmtFull(lastRothC.afterTaxWealth - lastTrad.afterTaxWealth)],
      ['RMDs Required', 'Yes, from age ' + inputs.rmdStartAge, 'None', 'None'],
      ['Breakeven Age', 'N/A (baseline)', breakevenB ? `Age ${breakevenB}` : 'No crossover', breakevenC ? `Age ${breakevenC}` : 'No crossover'],
      ['Tax Timing', 'Deferred (paid on RMDs)', 'Upfront (paid from IRA)', 'Upfront (paid from cash)'],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 44 },
      1: { textColor: [59, 130, 246] },
      2: { textColor: [245, 158, 11] },
      3: { textColor: [16, 185, 129] },
    },
    margin: { left: MARGIN, right: MARGIN },
  })
  y = (doc as any).lastAutoTable.finalY + 14

  y = sectionHeader(doc, 'Year-by-Year Projection Summary', y)
  // Show every 5 years to keep concise
  const summaryRows = traditional
    .filter((_, i) => i === 0 || (traditional[i].age % 5 === 0) || i === traditional.length - 1)
    .map((t, _, arr) => {
      const i = traditional.indexOf(t)
      const b = rothFromIRA[i]
      const c = rothFromCash[i]
      return [
        `${t.age}`,
        fmtFull(t.endBalance),
        fmtFull(t.rmdAmount),
        fmtFull(t.afterTaxWealth),
        fmtFull(b.endBalance),
        fmtFull(b.afterTaxWealth),
        fmtFull(c.endBalance),
        fmtFull(c.afterTaxWealth),
      ]
    })

  autoTable(doc, {
    startY: y,
    head: [['Age', 'Trad. Balance', 'RMD', 'Trad. Wealth', 'Roth B Balance', 'Roth B Wealth', 'Roth C Balance', 'Roth C Wealth']],
    body: summaryRows,
    headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: MARGIN, right: MARGIN },
    styles: { cellPadding: 2.5 },
  })
  addFooter(doc, meta)

  // ── PAGE 5: YEAR-BY-YEAR FULL TABLE ───────────────────────────────
  newPage(doc)
  y = MARGIN
  y = sectionHeader(doc, 'Complete Year-by-Year Ledger', y)

  autoTable(doc, {
    startY: y,
    head: [['Age', 'Trad. Balance', 'RMD', 'Tax (Trad.)', 'Net Dist.', 'Trad. Wealth', 'Roth C Balance', 'Roth C Wealth']],
    body: traditional.map((t, i) => {
      const c = rothFromCash[i]
      return [
        `${t.age}`,
        fmtFull(t.endBalance),
        t.rmdAmount > 0 ? fmtFull(t.rmdAmount) : '$0',
        t.taxesPaid > 0 ? fmtFull(t.taxesPaid) : '$0',
        t.netDistribution > 0 ? fmtFull(t.netDistribution) : '$0',
        fmtFull(t.afterTaxWealth),
        fmtFull(c.endBalance),
        fmtFull(c.afterTaxWealth),
      ]
    }),
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: MARGIN, right: MARGIN },
    styles: { cellPadding: 2 },
    didParseCell(data) {
      // Highlight RMD years
      if (data.section === 'body' && data.column.index === 2 && data.cell.raw !== '$0') {
        data.cell.styles.textColor = [59, 130, 246]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })
  addFooter(doc, meta)

  // ── PAGE 6: DISTRIBUTION ANALYSIS (if enabled) ────────────────────
  if (distData) {
    newPage(doc)
    y = MARGIN
    y = sectionHeader(doc, 'Systematic Distribution Analysis', y)

    const firstDist = distData.find(d => d.annualDistribution > 0)
    const depletionRow = distData.find(d => d.depleted)
    const totalDist = distData[distData.length - 1].cumulativeDistributions

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    const distNarrative = `The distribution analysis models systematic withdrawals from the Roth (Tax from Cash) account beginning at age ${firstDist?.age ?? 'N/A'}. The initial monthly distribution of ${fmtFull(distData.find(d => d.annualDistribution > 0)?.monthlyEquivalent ?? 0)} increases annually to maintain purchasing power. Over the projection horizon, total distributions are projected at ${fmtFull(totalDist)}.${depletionRow ? ` The Roth account is projected to be depleted at age ${depletionRow.age}.` : ' The Roth account remains solvent throughout the projection period.'}`
    const distSplit = doc.splitTextToSize(distNarrative, W - MARGIN * 2)
    doc.text(distSplit, MARGIN, y)
    y += distSplit.length * 5.5 + 8

    if (distImg) {
      doc.addImage(distImg, 'PNG', MARGIN, y, W - MARGIN * 2, 70)
      y += 76
    }

    y = sectionHeader(doc, 'Distribution Schedule', y)
    const distRows = distData
      .filter(d => d.annualDistribution > 0 || d.age === inputs.currentAge)
      .filter((_, i) => i === 0 || i % 3 === 0)
      .map(d => [
        `${d.age}`,
        fmtFull(d.beginBalance),
        fmtFull(d.annualDistribution),
        fmtFull(d.monthlyEquivalent),
        fmtFull(d.growth),
        fmtFull(d.endBalance),
        d.depleted ? 'Depleted' : '',
      ])

    autoTable(doc, {
      startY: y,
      head: [['Age', 'Begin Balance', 'Annual Dist.', 'Monthly Equiv.', 'Growth', 'End Balance', 'Status']],
      body: distRows,
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT },
      margin: { left: MARGIN, right: MARGIN },
      styles: { cellPadding: 2.5 },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 6 && data.cell.raw === 'Depleted') {
          data.cell.styles.textColor = [239, 68, 68]
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
    addFooter(doc, meta)
  }

  // ── FINAL PAGE: DISCLOSURES ────────────────────────────────────────
  newPage(doc)
  y = MARGIN
  y = sectionHeader(doc, 'Important Disclosures', y)

  const disclosures = [
    ['Educational Purpose', 'This report is prepared for informational and educational purposes only. It does not constitute tax, legal, or investment advice and should not be relied upon as such.'],
    ['No Guarantee', 'All projections are hypothetical and based on assumptions provided by the user. Actual results will vary due to market conditions, tax law changes, and individual circumstances.'],
    ['Tax Assumptions', 'A flat marginal tax rate is applied to all taxable events. In practice, large conversions may span multiple tax brackets. This analysis does not model bracket transitions, IRMAA surcharges, Social Security taxation, or state-specific exemptions.'],
    ['Growth Rate', 'A constant annual return is assumed for the deterministic projection. The Monte Carlo simulation provides a range of outcomes; neither guarantees future performance.'],
    ['RMD Calculations', 'Required Minimum Distributions are calculated using the IRS Uniform Lifetime Table (Publication 590-B) with the SECURE 2.0 Act starting age of 73. This is scheduled to increase to age 75 in 2033.'],
    ['Mid-Year Assumption', 'Growth calculations for years with withdrawals use the mid-year convention: growth = (Beginning Balance minus Half the Withdrawal) times the Growth Rate. This reflects the actuarial assumption that distributions occur evenly throughout the year.'],
    ['No Estate or IRMAA Modeling', 'This analysis does not account for estate planning benefits of Roth IRAs (no RMDs for heirs), nor does it model Medicare IRMAA surcharges triggered by high RMD income.'],
    ['Consult a Professional', 'Before making any financial decisions based on this analysis, consult a qualified Certified Public Accountant (CPA), Certified Financial Planner (CFP), or estate planning attorney who can review your complete financial picture.'],
    ['Data Privacy', 'All calculations in this tool are performed locally in your browser. No financial data is transmitted to external servers or stored in the cloud.'],
  ]

  if (meta.disclosureText) {
    disclosures.push(['Firm Disclosure', meta.disclosureText])
  }

  for (const [title, body] of disclosures) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text(title, MARGIN, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SLATE)
    const split = doc.splitTextToSize(body, W - MARGIN * 2)
    doc.text(split, MARGIN, y)
    y += split.length * 4.8 + 4

    if (y > H - 40) {
      addFooter(doc, meta)
      newPage(doc)
      y = MARGIN
    }
  }

  addFooter(doc, meta)

  doc.save(`${(meta.clientName || 'client').replace(/\s+/g, '_')}_roth_analysis.pdf`)
}
