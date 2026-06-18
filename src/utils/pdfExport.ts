import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ProjectionResults } from '../engine/types'
import { fmtFull, fmtPct } from './formatters'

export function exportToPDF(results: ProjectionResults): void {
  const { traditional, rothFromIRA, rothFromCash, breakevenB, breakevenC, inputs } = results
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

  const blue = [59, 130, 246] as [number, number, number]
  const dark = [10, 15, 30] as [number, number, number]
  const textColor = [240, 244, 255] as [number, number, number]

  doc.setFillColor(...dark)
  doc.rect(0, 0, 216, 40, 'F')
  doc.setTextColor(...textColor)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Roth Conversion Analysis', 14, 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 14, 26)
  doc.text(`Ages ${inputs.currentAge}–${inputs.endAge}  |  Initial Balance: ${fmtFull(inputs.initialBalance)}  |  Growth Rate: ${fmtPct(inputs.growthRate)}`, 14, 33)

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 14, 52)

  const lastTrad = traditional[traditional.length - 1]
  const lastRothB = rothFromIRA[rothFromIRA.length - 1]
  const lastRothC = rothFromCash[rothFromCash.length - 1]

  autoTable(doc, {
    startY: 56,
    head: [['Scenario', 'Final Balance', 'Total Taxes Paid', 'After-Tax Wealth']],
    body: [
      ['Traditional IRA', fmtFull(lastTrad.endBalance), fmtFull(lastTrad.cumulativeTaxes), fmtFull(lastTrad.afterTaxWealth)],
      ['Roth (Tax from IRA)', fmtFull(lastRothB.endBalance), fmtFull(lastRothB.cumulativeTaxesPaid), fmtFull(lastRothB.afterTaxWealth)],
      ['Roth (Tax from Cash)', fmtFull(lastRothC.endBalance), fmtFull(lastRothC.cumulativeTaxesPaid), fmtFull(lastRothC.afterTaxWealth)],
    ],
    headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  })

  const by = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Breakeven Analysis', 14, by)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(breakevenB ? `Roth (Tax from IRA) overtakes Traditional IRA at age ${breakevenB}.` : 'Roth (Tax from IRA) never overtakes Traditional IRA in this projection.', 14, by + 7)
  doc.text(breakevenC ? `Roth (Tax from Cash) overtakes Traditional IRA at age ${breakevenC}.` : 'Roth (Tax from Cash) never overtakes Traditional IRA in this projection.', 14, by + 14)

  const ay = by + 26
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Assumptions', 14, ay)
  autoTable(doc, {
    startY: ay + 4,
    head: [['Parameter', 'Value']],
    body: [
      ['Initial IRA Balance', fmtFull(inputs.initialBalance)],
      ['Annual Growth Rate', fmtPct(inputs.growthRate)],
      ['Federal Tax Rate', fmtPct(inputs.federalTaxRate)],
      ['State Tax Rate', fmtPct(inputs.stateTaxRate)],
      ['RMD Start Age', `${inputs.rmdStartAge}`],
      ['Conversion Amount', fmtFull(inputs.conversionAmount)],
      ['Conversion Age', `${inputs.conversionAge}`],
      ['Growth Rate', fmtPct(inputs.growthRate)],
    ],
    headStyles: { fillColor: blue, textColor: 255 },
    margin: { left: 14, right: 14 },
  })

  doc.addPage()
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Year-by-Year Projection', 14, 20)

  autoTable(doc, {
    startY: 25,
    head: [['Age', 'Trad. Balance', 'RMD', 'Tax (Trad)', 'Roth B Balance', 'Roth C Balance']],
    body: traditional.map((row, i) => [
      row.age,
      fmtFull(row.endBalance),
      fmtFull(row.rmdAmount),
      fmtFull(row.taxesPaid),
      fmtFull(rothFromIRA[i].endBalance),
      fmtFull(rothFromCash[i].endBalance),
    ]),
    headStyles: { fillColor: blue, textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  })

  doc.save('roth-conversion-analysis.pdf')
}

export function exportToCSV(results: ProjectionResults): void {
  const { traditional, rothFromIRA, rothFromCash } = results

  const headers = [
    'Age',
    'Trad Begin Balance', 'Trad Growth', 'Trad RMD', 'Trad Taxes', 'Trad End Balance', 'Trad Cumulative Taxes', 'Trad After-Tax Wealth',
    'Roth B Begin Balance', 'Roth B Growth', 'Roth B End Balance', 'Roth B Cumulative Taxes', 'Roth B After-Tax Wealth',
    'Roth C Begin Balance', 'Roth C Growth', 'Roth C End Balance', 'Roth C Cumulative Taxes', 'Roth C After-Tax Wealth',
  ]

  const rows = traditional.map((t, i) => {
    const b = rothFromIRA[i]
    const c = rothFromCash[i]
    return [
      t.age,
      t.beginBalance.toFixed(2), t.growth.toFixed(2), t.rmdAmount.toFixed(2), t.taxesPaid.toFixed(2), t.endBalance.toFixed(2), t.cumulativeTaxes.toFixed(2), t.afterTaxWealth.toFixed(2),
      b.beginBalance.toFixed(2), b.growth.toFixed(2), b.endBalance.toFixed(2), b.cumulativeTaxesPaid.toFixed(2), b.afterTaxWealth.toFixed(2),
      c.beginBalance.toFixed(2), c.growth.toFixed(2), c.endBalance.toFixed(2), c.cumulativeTaxesPaid.toFixed(2), c.afterTaxWealth.toFixed(2),
    ]
  })

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'roth-conversion-projection.csv'
  a.click()
  URL.revokeObjectURL(url)
}
