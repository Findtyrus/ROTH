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
  let prevBalance = balance
  let cumulativeNetDist = 0
  const results: number[] = []

  for (let i = 0; i < annualReturns.length; i++) {
    const age = inputs.currentAge + i
    const begin = balance
    const growth = begin * annualReturns[i]
    const balanceBeforeRMD = begin + growth

    const rmdBase = i === 0 ? begin : prevBalance
    const rmd = i === 0 ? 0 : calculateRMD(rmdBase, age, inputs.rmdStartAge)
    const actualRMD = Math.min(rmd, balanceBeforeRMD)
    const netDist = actualRMD * (1 - taxRate)

    prevBalance = balanceBeforeRMD - actualRMD
    balance = prevBalance
    cumulativeNetDist += netDist
    results.push(Math.max(0, balance + cumulativeNetDist))
  }
  return results
}

function simulateRothCash(inputs: PlanInputs, annualReturns: number[]): number[] {
  let balance = inputs.initialBalance
  const results: number[] = []

  for (let i = 0; i < annualReturns.length; i++) {
    const age = inputs.currentAge + i
    if (age === inputs.conversionAge) {
      balance = inputs.conversionAmount
    }
    balance = balance + balance * annualReturns[i]
    results.push(Math.max(0, balance))
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
