import type {
  PlanInputs,
  DistributionInputs,
  ProjectionResults,
  TraditionalYearData,
  RothFromIRAYearData,
  RothFromCashYearData,
  RothFromIRAWithSideYearData,
} from './types'
import { calculateRMD } from './rmdTable'

export function effectiveTaxRate(inputs: PlanInputs): number {
  return Math.min(inputs.federalTaxRate + inputs.stateTaxRate, 0.85)
}

/**
 * Mid-year withdrawal assumption: distributions are spread through the year,
 * so effectively half the withdrawal has left before earning returns.
 * growth = max(0, beginBalance - withdrawal/2) * rate
 */
export function midYearGrowth(beginBalance: number, withdrawal: number, rate: number): number {
  return Math.max(0, beginBalance - withdrawal / 2) * rate
}

function annualDistTarget(age: number, dist: DistributionInputs): number {
  if (!dist.enabled || age < dist.distributionStartAge) return 0
  const yearsElapsed = age - dist.distributionStartAge
  return dist.monthlyDistribution * 12 * Math.pow(1 + dist.distributionIncreaseRate, yearsElapsed)
}

function projectTraditional(inputs: PlanInputs, dist: DistributionInputs): TraditionalYearData[] {
  const rows: TraditionalYearData[] = []
  const taxRate = effectiveTaxRate(inputs)
  const g = inputs.growthRate

  let balance = inputs.initialBalance
  let prevBalance = inputs.initialBalance  // prior year-end balance for RMD base
  let cumulativeTaxes = 0
  let cumulativeNetDist = 0

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    const begin = balance

    // RMD: always use prior year-end balance as base (IRS rule).
    // calculateRMD returns 0 when age < rmdStartAge — no special-casing needed.
    const rmd = calculateRMD(prevBalance, age, inputs.rmdStartAge)

    const distTarget = annualDistTarget(age, dist)
    const totalWithdrawal = Math.min(begin, Math.max(rmd, distTarget))

    const growth = totalWithdrawal > 0
      ? midYearGrowth(begin, totalWithdrawal, g)
      : begin * g

    const afterGrowth = begin + growth
    const actualWithdrawal = Math.min(totalWithdrawal, afterGrowth)
    const actualRMD = Math.min(rmd, afterGrowth)
    const taxes = actualWithdrawal * taxRate
    const netDist = actualWithdrawal - taxes
    const end = Math.max(0, afterGrowth - actualWithdrawal)

    cumulativeTaxes += taxes
    cumulativeNetDist += netDist
    prevBalance = end

    rows.push({
      age,
      beginBalance: begin,
      growth,
      rmdAmount: actualRMD,
      totalWithdrawal: actualWithdrawal,
      taxesPaid: taxes,
      netDistribution: netDist,
      endBalance: end,
      cumulativeTaxes,
      afterTaxWealth: end * (1 - taxRate) + cumulativeNetDist,
      cumulativeNetDistributions: cumulativeNetDist,
    })

    balance = end
  }

  return rows
}

function projectRothFromIRA(inputs: PlanInputs, dist: DistributionInputs): RothFromIRAYearData[] {
  const rows: RothFromIRAYearData[] = []
  const taxRate = effectiveTaxRate(inputs)
  const g = inputs.growthRate

  let tradBalance = inputs.initialBalance
  let rothBalance = 0
  let prevTradBalance = inputs.initialBalance
  let cumulativeTaxesPaid = 0
  let cumulativeNetDist = 0

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    // IRS rule: in an RMD year, the RMD must be taken BEFORE a Roth conversion.
    // Amounts that satisfy the RMD cannot be rolled into a Roth.
    let preConvRMD = 0
    let preConvRMDTax = 0
    if (age === inputs.conversionAge && age >= inputs.rmdStartAge) {
      preConvRMD = Math.min(calculateRMD(prevTradBalance, age, inputs.rmdStartAge), tradBalance)
      preConvRMDTax = preConvRMD * taxRate
      tradBalance -= preConvRMD
      cumulativeTaxesPaid += preConvRMDTax
      cumulativeNetDist += preConvRMD - preConvRMDTax
    }

    // Apply conversion after mandatory RMD has been satisfied.
    let conversionTaxThisYear = 0
    if (age === inputs.conversionAge) {
      const amountToConvert = Math.min(inputs.conversionAmount, tradBalance)
      const taxDue = amountToConvert * taxRate
      tradBalance -= amountToConvert
      rothBalance += amountToConvert - taxDue  // tax paid from IRA proceeds
      cumulativeTaxesPaid += taxDue
      conversionTaxThisYear = taxDue
    }

    const beginTrad = tradBalance
    const beginRoth = rothBalance
    const beginBalance = beginTrad + beginRoth

    // RMD from Traditional: 0 in the conversion year if already taken above.
    const rmd = preConvRMD > 0 ? 0 : calculateRMD(prevTradBalance, age, inputs.rmdStartAge)
    const distTarget = annualDistTarget(age, dist)

    // preConvRMD already counts toward the distribution target for this year.
    const additionalNeeded = Math.max(0, distTarget - rmd - preConvRMD)
    const rothWithdrawal = Math.min(additionalNeeded, beginRoth)
    const extraFromTrad = Math.max(0, additionalNeeded - rothWithdrawal)
    const totalTradWithdrawal = Math.min(beginTrad, rmd + extraFromTrad)

    const tradGrowth = totalTradWithdrawal > 0
      ? midYearGrowth(beginTrad, totalTradWithdrawal, g)
      : beginTrad * g
    const tradAfterGrowth = beginTrad + tradGrowth
    const actualTradWithdrawal = Math.min(totalTradWithdrawal, tradAfterGrowth)
    const actualRMD = Math.min(rmd, tradAfterGrowth)
    const tradTaxes = actualTradWithdrawal * taxRate
    const tradNetDist = actualTradWithdrawal - tradTaxes
    const endTrad = Math.max(0, tradAfterGrowth - actualTradWithdrawal)

    const rothGrowth = rothWithdrawal > 0
      ? midYearGrowth(beginRoth, rothWithdrawal, g)
      : beginRoth * g
    const rothAfterGrowth = beginRoth + rothGrowth
    const actualRothWithdrawal = Math.min(rothWithdrawal, rothAfterGrowth)
    const endRoth = Math.max(0, rothAfterGrowth - actualRothWithdrawal)

    const totalNetDist = tradNetDist + actualRothWithdrawal  // Roth portion is tax-free
    cumulativeTaxesPaid += tradTaxes
    cumulativeNetDist += totalNetDist
    prevTradBalance = endTrad

    tradBalance = endTrad
    rothBalance = endRoth

    rows.push({
      age,
      tradBalance: endTrad,
      rothBalance: endRoth,
      beginBalance,
      growth: tradGrowth + rothGrowth,
      rmdAmount: preConvRMD > 0 ? preConvRMD : actualRMD,
      taxesPaid: preConvRMDTax + conversionTaxThisYear + tradTaxes,
      netDistribution: (preConvRMD - preConvRMDTax) + totalNetDist,
      endBalance: endTrad + endRoth,
      cumulativeTaxesPaid,
      afterTaxWealth: endRoth + endTrad * (1 - taxRate) + cumulativeNetDist,
      cumulativeNetDistributions: cumulativeNetDist,
    })
  }

  return rows
}

function projectRothFromCash(inputs: PlanInputs, dist: DistributionInputs): RothFromCashYearData[] {
  const rows: RothFromCashYearData[] = []
  const taxRate = effectiveTaxRate(inputs)
  const g = inputs.growthRate

  let tradBalance = inputs.initialBalance
  let rothBalance = 0
  let prevTradBalance = inputs.initialBalance
  let cumulativeTaxesPaid = 0
  let cumulativeNetDist = 0
  let totalCashTaxPaid = 0  // accumulated external cash tax cost

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    let taxPaidFromCash = 0

    // IRS rule: in an RMD year, the RMD must be taken BEFORE a Roth conversion.
    let preConvRMD = 0
    let preConvRMDTax = 0
    if (age === inputs.conversionAge && age >= inputs.rmdStartAge) {
      preConvRMD = Math.min(calculateRMD(prevTradBalance, age, inputs.rmdStartAge), tradBalance)
      preConvRMDTax = preConvRMD * taxRate
      tradBalance -= preConvRMD
      cumulativeTaxesPaid += preConvRMDTax
      cumulativeNetDist += preConvRMD - preConvRMDTax
    }

    if (age === inputs.conversionAge) {
      const amountToConvert = Math.min(inputs.conversionAmount, tradBalance)
      const taxDue = amountToConvert * taxRate
      tradBalance -= amountToConvert
      rothBalance += amountToConvert  // full amount — tax comes from external cash
      taxPaidFromCash = taxDue
      cumulativeTaxesPaid += taxDue
      totalCashTaxPaid += taxDue
    }

    const beginTrad = tradBalance
    const beginRoth = rothBalance
    const beginBalance = beginTrad + beginRoth

    const rmd = preConvRMD > 0 ? 0 : calculateRMD(prevTradBalance, age, inputs.rmdStartAge)
    const distTarget = annualDistTarget(age, dist)

    const additionalNeeded = Math.max(0, distTarget - rmd - preConvRMD)
    const rothWithdrawal = Math.min(additionalNeeded, beginRoth)
    const extraFromTrad = Math.max(0, additionalNeeded - rothWithdrawal)
    const totalTradWithdrawal = Math.min(beginTrad, rmd + extraFromTrad)

    const tradGrowth = totalTradWithdrawal > 0
      ? midYearGrowth(beginTrad, totalTradWithdrawal, g)
      : beginTrad * g
    const tradAfterGrowth = beginTrad + tradGrowth
    const actualTradWithdrawal = Math.min(totalTradWithdrawal, tradAfterGrowth)
    const actualRMD = Math.min(rmd, tradAfterGrowth)
    const tradTaxes = actualTradWithdrawal * taxRate
    const tradNetDist = actualTradWithdrawal - tradTaxes
    const endTrad = Math.max(0, tradAfterGrowth - actualTradWithdrawal)

    const rothGrowth = rothWithdrawal > 0
      ? midYearGrowth(beginRoth, rothWithdrawal, g)
      : beginRoth * g
    const rothAfterGrowth = beginRoth + rothGrowth
    const actualRothWithdrawal = Math.min(rothWithdrawal, rothAfterGrowth)
    const endRoth = Math.max(0, rothAfterGrowth - actualRothWithdrawal)

    const totalNetDist = tradNetDist + actualRothWithdrawal
    cumulativeTaxesPaid += tradTaxes
    cumulativeNetDist += totalNetDist
    prevTradBalance = endTrad

    tradBalance = endTrad
    rothBalance = endRoth

    const gross = endRoth + endTrad * (1 - taxRate) + cumulativeNetDist
    const net = gross - totalCashTaxPaid

    rows.push({
      age,
      tradBalance: endTrad,
      rothBalance: endRoth,
      beginBalance,
      growth: tradGrowth + rothGrowth,
      rmdAmount: preConvRMD > 0 ? preConvRMD : actualRMD,
      taxesPaid: preConvRMDTax + taxPaidFromCash + tradTaxes,
      netDistribution: (preConvRMD - preConvRMDTax) + totalNetDist,
      endBalance: endTrad + endRoth,
      taxPaidFromCash,
      cumulativeTaxesPaid,
      afterTaxWealthGross: gross,
      afterTaxWealth: net,
      cumulativeNetDistributions: cumulativeNetDist,
    })
  }

  return rows
}

// Scenario D: same IRA conversion as Roth B (tax from IRA), but the conversion
// tax amount is invested separately in a side account at the same growth rate.
// The side account is never drawn down for retirement withdrawals.
function projectRothFromIRAWithSide(
  inputs: PlanInputs,
  dist: DistributionInputs,
): RothFromIRAWithSideYearData[] {
  const rows: RothFromIRAWithSideYearData[] = []
  const taxRate = effectiveTaxRate(inputs)
  const g = inputs.growthRate

  let tradBalance = inputs.initialBalance
  let rothBalance = 0
  let prevTradBalance = inputs.initialBalance
  let cumulativeTaxesPaid = 0
  let cumulativeNetDist = 0
  let sideAccountBalance = 0

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    // IRS rule: RMD before conversion when conversionAge >= rmdStartAge
    let preConvRMD = 0
    let preConvRMDTax = 0
    if (age === inputs.conversionAge && age >= inputs.rmdStartAge) {
      preConvRMD = Math.min(calculateRMD(prevTradBalance, age, inputs.rmdStartAge), tradBalance)
      preConvRMDTax = preConvRMD * taxRate
      tradBalance -= preConvRMD
      cumulativeTaxesPaid += preConvRMDTax
      cumulativeNetDist += preConvRMD - preConvRMDTax
    }

    // Conversion: tax paid from IRA (same as Roth B).
    // The tax amount seeds the side account instead of coming from outside cash.
    let conversionTaxThisYear = 0
    if (age === inputs.conversionAge) {
      const amountToConvert = Math.min(inputs.conversionAmount, tradBalance)
      const taxDue = amountToConvert * taxRate
      tradBalance -= amountToConvert
      rothBalance += amountToConvert - taxDue
      cumulativeTaxesPaid += taxDue
      conversionTaxThisYear = taxDue
      sideAccountBalance = taxDue  // cash that would have been used externally is invested here
    }

    // Side account grows every year (including conversion year) at portfolio rate.
    // No withdrawals ever come from the side account.
    const sideGrowth = sideAccountBalance * g
    sideAccountBalance += sideGrowth

    const beginTrad = tradBalance
    const beginRoth = rothBalance
    const beginBalance = beginTrad + beginRoth

    const rmd = preConvRMD > 0 ? 0 : calculateRMD(prevTradBalance, age, inputs.rmdStartAge)
    const distTarget = annualDistTarget(age, dist)

    const additionalNeeded = Math.max(0, distTarget - rmd - preConvRMD)
    const rothWithdrawal = Math.min(additionalNeeded, beginRoth)
    const extraFromTrad = Math.max(0, additionalNeeded - rothWithdrawal)
    const totalTradWithdrawal = Math.min(beginTrad, rmd + extraFromTrad)

    const tradGrowth = totalTradWithdrawal > 0
      ? midYearGrowth(beginTrad, totalTradWithdrawal, g)
      : beginTrad * g
    const tradAfterGrowth = beginTrad + tradGrowth
    const actualTradWithdrawal = Math.min(totalTradWithdrawal, tradAfterGrowth)
    const actualRMD = Math.min(rmd, tradAfterGrowth)
    const tradTaxes = actualTradWithdrawal * taxRate
    const tradNetDist = actualTradWithdrawal - tradTaxes
    const endTrad = Math.max(0, tradAfterGrowth - actualTradWithdrawal)

    const rothGrowth = rothWithdrawal > 0
      ? midYearGrowth(beginRoth, rothWithdrawal, g)
      : beginRoth * g
    const rothAfterGrowth = beginRoth + rothGrowth
    const actualRothWithdrawal = Math.min(rothWithdrawal, rothAfterGrowth)
    const endRoth = Math.max(0, rothAfterGrowth - actualRothWithdrawal)

    const totalNetDist = tradNetDist + actualRothWithdrawal
    cumulativeTaxesPaid += tradTaxes
    cumulativeNetDist += totalNetDist
    prevTradBalance = endTrad

    tradBalance = endTrad
    rothBalance = endRoth

    // Roth D total wealth = Roth B after-tax wealth + side account
    const rothBWealth = endRoth + endTrad * (1 - taxRate) + cumulativeNetDist
    const totalWealth = rothBWealth + sideAccountBalance

    rows.push({
      age,
      tradBalance: endTrad,
      rothBalance: endRoth,
      beginBalance,
      growth: tradGrowth + rothGrowth,
      rmdAmount: preConvRMD > 0 ? preConvRMD : actualRMD,
      taxesPaid: preConvRMDTax + conversionTaxThisYear + tradTaxes,
      netDistribution: (preConvRMD - preConvRMDTax) + totalNetDist,
      endBalance: endTrad + endRoth,
      cumulativeTaxesPaid,
      sideAccountBalance,
      sideAccountGrowth: sideGrowth,
      afterTaxWealth: totalWealth,
      cumulativeNetDistributions: cumulativeNetDist,
    })
  }

  return rows
}

function findBreakeven(
  traditional: TraditionalYearData[],
  roth: RothFromIRAYearData[] | RothFromCashYearData[] | RothFromIRAWithSideYearData[],
): number | null {
  for (let i = 0; i < traditional.length; i++) {
    if (roth[i].afterTaxWealth > traditional[i].afterTaxWealth) {
      return traditional[i].age
    }
  }
  return null
}

export function runProjection(inputs: PlanInputs, dist: DistributionInputs): ProjectionResults {
  const traditional = projectTraditional(inputs, dist)
  const rothFromIRA = projectRothFromIRA(inputs, dist)
  const rothFromCash = projectRothFromCash(inputs, dist)
  const rothFromIRAWithSide = projectRothFromIRAWithSide(inputs, dist)

  return {
    traditional,
    rothFromIRA,
    rothFromCash,
    rothFromIRAWithSide,
    breakevenB: findBreakeven(traditional, rothFromIRA),
    breakevenC: findBreakeven(traditional, rothFromCash),
    breakevenD: findBreakeven(traditional, rothFromIRAWithSide),
    inputs,
    distInputs: dist,
  }
}
