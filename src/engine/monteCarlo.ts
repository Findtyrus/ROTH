import type { MonteCarloResult, MonteCarloResults, PlanInputs, DistributionInputs } from './types'
import { calculateRMD } from './rmdTable'

function randn(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function annualDistTarget(age: number, dist: DistributionInputs): number {
  if (!dist.enabled || age < dist.distributionStartAge) return 0
  const yearsElapsed = age - dist.distributionStartAge
  return dist.monthlyDistribution * 12 * Math.pow(1 + dist.distributionIncreaseRate, yearsElapsed)
}

function simulateTraditional(inputs: PlanInputs, dist: DistributionInputs, annualReturns: number[]): number[] {
  const taxRate = Math.min(inputs.federalTaxRate + inputs.stateTaxRate, 0.85)
  let balance = inputs.initialBalance
  let prevBalance = inputs.initialBalance
  let cumulativeNetDist = 0
  const results: number[] = []

  for (let i = 0; i < annualReturns.length; i++) {
    const age = inputs.currentAge + i
    const begin = balance

    const rmd = calculateRMD(prevBalance, age, inputs.rmdStartAge)
    const distTarget = annualDistTarget(age, dist)
    const totalWithdrawal = Math.min(begin, Math.max(rmd, distTarget))

    const growth = totalWithdrawal > 0
      ? Math.max(0, begin - totalWithdrawal / 2) * annualReturns[i]
      : begin * annualReturns[i]

    const afterGrowth = begin + growth
    const realWithdrawal = Math.min(totalWithdrawal, afterGrowth)
    const netDist = realWithdrawal * (1 - taxRate)

    prevBalance = Math.max(0, afterGrowth - realWithdrawal)
    balance = prevBalance
    cumulativeNetDist += netDist

    results.push(Math.max(0, balance * (1 - taxRate) + cumulativeNetDist))
  }
  return results
}

function simulateRothCash(inputs: PlanInputs, dist: DistributionInputs, annualReturns: number[]): number[] {
  const taxRate = Math.min(inputs.federalTaxRate + inputs.stateTaxRate, 0.85)
  let tradBalance = inputs.initialBalance
  let rothBalance = 0
  let prevTradBalance = inputs.initialBalance
  const totalCashTaxPaid = Math.min(inputs.conversionAmount, inputs.initialBalance) * taxRate
  let cumulativeNetDist = 0
  const results: number[] = []

  for (let i = 0; i < annualReturns.length; i++) {
    const age = inputs.currentAge + i

    if (age === inputs.conversionAge) {
      const amount = Math.min(inputs.conversionAmount, tradBalance)
      tradBalance -= amount
      rothBalance += amount
    }

    const rmd = calculateRMD(prevTradBalance, age, inputs.rmdStartAge)
    const distTarget = annualDistTarget(age, dist)

    // Mirrors deterministic withdrawal order: RMD from Trad, additional from Roth, overflow back to Trad
    const additionalNeeded = Math.max(0, distTarget - rmd)
    const rothWithdrawal = Math.min(additionalNeeded, rothBalance)
    const extraFromTrad = Math.max(0, additionalNeeded - rothWithdrawal)
    const totalTradWithdrawal = Math.min(tradBalance, rmd + extraFromTrad)

    const tradGrowth = totalTradWithdrawal > 0
      ? Math.max(0, tradBalance - totalTradWithdrawal / 2) * annualReturns[i]
      : tradBalance * annualReturns[i]
    const tradAfterGrowth = tradBalance + tradGrowth
    const actualTradWithdrawal = Math.min(totalTradWithdrawal, tradAfterGrowth)
    tradBalance = Math.max(0, tradAfterGrowth - actualTradWithdrawal)
    prevTradBalance = tradBalance
    const tradNetDist = actualTradWithdrawal * (1 - taxRate)

    const rothGrowth = rothWithdrawal > 0
      ? Math.max(0, rothBalance - rothWithdrawal / 2) * annualReturns[i]
      : rothBalance * annualReturns[i]
    const rothAfterGrowth = rothBalance + rothGrowth
    const actualRothWithdrawal = Math.min(rothWithdrawal, rothAfterGrowth)
    rothBalance = Math.max(0, rothAfterGrowth - actualRothWithdrawal)

    cumulativeNetDist += tradNetDist + actualRothWithdrawal

    results.push(Math.max(0, rothBalance + tradBalance * (1 - taxRate) + cumulativeNetDist - totalCashTaxPaid))
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
  dist: DistributionInputs,
  runs = 1000,
  stdDev = 0.12,
): MonteCarloResults {
  const years = inputs.endAge - inputs.currentAge + 1
  const mean = inputs.growthRate

  const tradPaths: number[][] = []
  const rothPaths: number[][] = []

  for (let r = 0; r < runs; r++) {
    const returns = Array.from({ length: years }, () =>
      Math.max(-0.5, mean + stdDev * randn())
    )
    tradPaths.push(simulateTraditional(inputs, dist, returns))
    rothPaths.push(simulateRothCash(inputs, dist, returns))
  }

  return {
    traditional: aggregate(tradPaths, inputs.currentAge),
    rothFromCash: aggregate(rothPaths, inputs.currentAge),
    runs,
  }
}
