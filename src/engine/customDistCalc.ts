import type { PlanInputs, DistributionInputs, DistYearData } from './types'
import { effectiveTaxRate, midYearGrowth } from './calculator'
import { calculateRMD } from './rmdTable'

/**
 * COLA-adjusted annual distribution for a given year.
 * Year 0 = distributionStartAge, increases each year by distributionIncreaseRate.
 */
function getAnnualDist(base: number, rate: number, yearsElapsed: number): number {
  return base * Math.pow(1 + rate, yearsElapsed)
}

/**
 * Projects the Roth (from Cash) account balance under a systematic withdrawal plan
 * with annual COLA increases. Uses the mid-year withdrawal growth assumption.
 *
 * Roth distributions are tax-free — no tax applied to withdrawals.
 */
export function projectWithDistributions(
  inputs: PlanInputs,
  dist: DistributionInputs,
): DistYearData[] {
  const rows: DistYearData[] = []
  const g = inputs.growthRate
  const annualBase = dist.monthlyDistribution * 12

  // Start with the full Roth (Cash) balance at conversion age
  let balance = inputs.initialBalance
  let cumulativeDist = 0
  let depleted = false

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    // Apply Roth conversion at conversion age
    if (age === inputs.conversionAge) {
      balance = inputs.conversionAmount
    }

    const begin = balance
    const yearsElapsed = Math.max(0, age - dist.distributionStartAge)
    const takingDist = !depleted && dist.enabled && age >= dist.distributionStartAge

    const annualDist = takingDist ? getAnnualDist(annualBase, dist.distributionIncreaseRate, yearsElapsed) : 0
    const actualDist = Math.min(annualDist, begin)

    const growth = actualDist > 0
      ? midYearGrowth(begin, actualDist, g)
      : begin * g

    const end = Math.max(0, begin + growth - actualDist)

    cumulativeDist += actualDist

    if (end <= 0 && !depleted && takingDist) {
      depleted = true
    }

    rows.push({
      age,
      beginBalance: begin,
      annualDistribution: actualDist,
      monthlyEquivalent: actualDist / 12,
      growth,
      endBalance: end,
      cumulativeDistributions: cumulativeDist,
      depleted: end <= 0 && actualDist > 0,
    })

    balance = end
  }

  return rows
}

/**
 * Also runs a Traditional IRA with the same withdrawal amounts taken alongside RMDs.
 * If custom dist < RMD, only RMD is taken (IRS minimum). If custom dist > RMD, the
 * excess is taken as a discretionary withdrawal (also taxable).
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
  let prevBalance = balance
  let cumulativeDist = 0
  let depleted = false

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    const begin = balance

    const yearsElapsed = Math.max(0, age - dist.distributionStartAge)
    const takingDist = !depleted && dist.enabled && age >= dist.distributionStartAge

    const rmdBase = age === inputs.currentAge ? begin : prevBalance
    const rmdRaw = age === inputs.currentAge ? 0 : calculateRMD(rmdBase, age, inputs.rmdStartAge)
    const customAmount = takingDist ? getAnnualDist(annualBase, dist.distributionIncreaseRate, yearsElapsed) : 0

    // Total withdrawal = max(RMD, custom) since RMD is mandatory minimum
    const totalWithdrawal = Math.min(Math.max(rmdRaw, customAmount), begin)

    const growth = totalWithdrawal > 0
      ? midYearGrowth(begin, totalWithdrawal, g)
      : begin * g

    const balanceAfterGrowth = begin + growth
    const actualWithdrawal = Math.min(totalWithdrawal, balanceAfterGrowth)
    const taxes = actualWithdrawal * taxRate
    const netDist = actualWithdrawal - taxes
    const end = Math.max(0, balanceAfterGrowth - actualWithdrawal)

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
