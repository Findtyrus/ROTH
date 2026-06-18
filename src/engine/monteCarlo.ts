import type { MonteCarloResult, MonteCarloResults, PlanInputs } from './types'
import { calculateRMD } from './rmdTable'

function randn(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function simulateTraditional(inputs: PlanInputs, annualReturns: number[]): number[] {
  const taxRate = Math.min(inputs.federalTaxRate + inputs.stateTaxRate, 0.85)
  let balance = inputs.initialBalance
  let prevBalance = inputs.initialBalance  // prior year-end balance for RMD
  let cumulativeNetDist = 0
  const results: number[] = []

  for (let i = 0; i < annualReturns.length; i++) {
    const age = inputs.currentAge + i
    const begin = balance

    const rmd = calculateRMD(prevBalance, age, inputs.rmdStartAge)
    const actualRMD = Math.min(rmd, begin)

    // Mid-year growth consistent with deterministic calculator
    const growth = actualRMD > 0
      ? Math.max(0, begin - actualRMD / 2) * annualReturns[i]
      : begin * annualReturns[i]

    const afterGrowth = begin + growth
    const realRMD = Math.min(actualRMD, afterGrowth)
    const netDist = realRMD * (1 - taxRate)

    prevBalance = Math.max(0, afterGrowth - realRMD)
    balance = prevBalance
    cumulativeNetDist += netDist

    // Corrected after-tax wealth: liquidation value + cumulative net distributions
    results.push(Math.max(0, balance * (1 - taxRate) + cumulativeNetDist))
  }
  return results
}

function simulateRothCash(inputs: PlanInputs, annualReturns: number[]): number[] {
  const taxRate = Math.min(inputs.federalTaxRate + inputs.stateTaxRate, 0.85)
  let tradBalance = inputs.initialBalance
  let rothBalance = 0
  const totalCashTaxPaid = Math.min(inputs.conversionAmount, inputs.initialBalance) * taxRate
  const results: number[] = []

  for (let i = 0; i < annualReturns.length; i++) {
    const age = inputs.currentAge + i

    // Apply conversion at conversion age (preserves pre-conversion growth)
    if (age === inputs.conversionAge) {
      const amount = Math.min(inputs.conversionAmount, tradBalance)
      tradBalance -= amount
      rothBalance += amount  // full amount, tax paid from external cash
    }

    tradBalance = Math.max(0, tradBalance * (1 + annualReturns[i]))
    rothBalance = Math.max(0, rothBalance * (1 + annualReturns[i]))

    // Net after-tax wealth: Roth (full) + trad liquidation - cash tax paid
    results.push(Math.max(0, rothBalance + tradBalance * (1 - taxRate) - totalCashTaxPaid))
  }
  return results
}

function aggregate(paths: number[][], startAge: number): MonteCarloResult[] {
  if (paths.length === 0) return []
  const years = paths[0].length
  const results: MonteCarloResult[] = []

  for (let y = 0; y < years; y++) {
    const vals = paths.map(p => p[y]).sort((a, b) => a - b)
    const n = vals.length
    const pct = (p: number) => vals[Math.floor((p / 100) * (n - 1))]
    results.push({
      age: startAge + y,
      p10: pct(10),
      p25: pct(25),
      p50: pct(50),
      p75: pct(75),
      p90: pct(90),
    })
  }
  return results
}

export function runMonteCarlo(
  inputs: PlanInputs,
  runs: number = 1000,
  stdDev: number = 0.12,
): MonteCarloResults {
  const years = inputs.endAge - inputs.currentAge + 1
  const mean = inputs.growthRate

  const tradPaths: number[][] = []
  const rothPaths: number[][] = []

  for (let r = 0; r < runs; r++) {
    const returns = Array.from({ length: years }, () =>
      Math.max(-0.5, mean + stdDev * randn())
    )
    tradPaths.push(simulateTraditional(inputs, returns))
    rothPaths.push(simulateRothCash(inputs, returns))
  }

  return {
    traditional: aggregate(tradPaths, inputs.currentAge),
    rothFromCash: aggregate(rothPaths, inputs.currentAge),
    runs,
  }
}
