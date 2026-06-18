import type { PlanInputs, DistributionInputs, DistYearData } from './types'
import { effectiveTaxRate, midYearGrowth } from './calculator'
import { calculateRMD } from './rmdTable'

function getAnnualDist(base: number, rate: number, yearsElapsed: number): number {
  return base * Math.pow(1 + rate, yearsElapsed)
}

/**
 * Projects the Roth (from Cash) account balance under a systematic withdrawal plan.
 * Tracks Traditional and Roth balances separately to preserve pre-conversion growth.
 * Distributions are taken from the Roth account (tax-free).
 */
export function projectWithDistributions(
  inputs: PlanInputs,
  dist: DistributionInputs,
): DistYearData[] {
  const rows: DistYearData[] = []
  const g = inputs.growthRate
  const annualBase = dist.monthlyDistribution * 12

  let tradBalance = inputs.initialBalance
  let rothBalance = 0
  let cumulativeDist = 0
  let depleted = false

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    // Apply conversion at conversion age (Roth Cash: full amount enters Roth)
    if (age === inputs.conversionAge) {
      const amount = Math.min(inputs.conversionAmount, tradBalance)
      tradBalance -= amount
      rothBalance += amount
    }

    const yearsElapsed = Math.max(0, age - dist.distributionStartAge)
    const takingDist = !depleted && dist.enabled && age >= dist.distributionStartAge

    const annualDist = takingDist
      ? getAnnualDist(annualBase, dist.distributionIncreaseRate, yearsElapsed)
      : 0
    const actualDist = Math.min(annualDist, rothBalance)

    // Roth grows with mid-year assumption when distributing
    const rothGrowth = actualDist > 0
      ? midYearGrowth(rothBalance, actualDist, g)
      : rothBalance * g

    const endRoth = Math.max(0, rothBalance + rothGrowth - actualDist)

    // Traditional continues to grow independently (no distributions taken here)
    tradBalance = tradBalance * (1 + g)

    cumulativeDist += actualDist

    if (endRoth <= 0 && !depleted && takingDist) {
      depleted = true
    }

    rows.push({
      age,
      beginBalance: rothBalance,
      annualDistribution: actualDist,
      monthlyEquivalent: actualDist / 12,
      growth: rothGrowth,
      endBalance: endRoth,
      cumulativeDistributions: cumulativeDist,
      depleted: endRoth <= 0 && actualDist > 0,
    })

    rothBalance = endRoth
  }

  return rows
}

/**
 * Projects Traditional IRA with systematic withdrawals alongside mandatory RMDs.
 * If the distribution target exceeds the RMD, the excess is a voluntary taxable withdrawal.
 */
export function projectTraditionalWithDist(
  inputs: PlanInputs,
  dist: DistributionInputs,
): DistYearData[] {
  const rows: DistYearData[] = []
  const taxRate = effectiveTaxRate(inputs)
  const g = inputs.growthRate
  const annualBase = dist.monthlyDistribution * 12

  let balance = inputs.initialBalance
  let prevBalance = inputs.initialBalance
  let cumulativeDist = 0
  let depleted = false

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    const begin = balance

    const yearsElapsed = Math.max(0, age - dist.distributionStartAge)
    const takingDist = !depleted && dist.enabled && age >= dist.distributionStartAge

    const rmd = calculateRMD(prevBalance, age, inputs.rmdStartAge)
    const customAmount = takingDist
      ? getAnnualDist(annualBase, dist.distributionIncreaseRate, yearsElapsed)
      : 0

    const totalWithdrawal = Math.min(Math.max(rmd, customAmount), begin)

    const growth = totalWithdrawal > 0
      ? midYearGrowth(begin, totalWithdrawal, g)
      : begin * g

    const afterGrowth = begin + growth
    const actualWithdrawal = Math.min(totalWithdrawal, afterGrowth)
    const taxes = actualWithdrawal * taxRate
    const netDist = actualWithdrawal - taxes
    const end = Math.max(0, afterGrowth - actualWithdrawal)

    cumulativeDist += netDist
    prevBalance = end

    if (end <= 0 && !depleted && actualWithdrawal > 0) {
      depleted = true
    }

    rows.push({
      age,
      beginBalance: begin,
      annualDistribution: netDist,
      monthlyEquivalent: netDist / 12,
      growth,
      endBalance: end,
      cumulativeDistributions: cumulativeDist,
      depleted: end <= 0 && actualWithdrawal > 0,
    })

    balance = end
  }

  return rows
}
