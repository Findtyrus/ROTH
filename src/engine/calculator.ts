import type {
  PlanInputs,
  ProjectionResults,
  TraditionalYearData,
  RothFromIRAYearData,
  RothFromCashYearData,
} from './types'
import { calculateRMD } from './rmdTable'

function effectiveTaxRate(inputs: PlanInputs): number {
  return Math.min(inputs.federalTaxRate + inputs.stateTaxRate, 0.85)
}

function projectTraditional(inputs: PlanInputs): TraditionalYearData[] {
  const rows: TraditionalYearData[] = []
  const taxRate = effectiveTaxRate(inputs)
  const g = inputs.growthRate

  let balance = inputs.initialBalance
  let cumulativeTaxes = 0
  let cumulativeNetDist = 0
  let prevBalance = balance

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    const begin = balance
    const growth = begin * g
    const balanceBeforeRMD = begin + growth

    const rmdBase = age === inputs.currentAge ? begin : prevBalance
    const rmd = age === inputs.currentAge
      ? 0
      : calculateRMD(rmdBase, age, inputs.rmdStartAge)

    const actualRMD = Math.min(rmd, balanceBeforeRMD)
    const taxes = actualRMD * taxRate
    const netDist = actualRMD - taxes
    const end = balanceBeforeRMD - actualRMD

    cumulativeTaxes += taxes
    cumulativeNetDist += netDist
    prevBalance = end

    rows.push({
      age,
      beginBalance: begin,
      growth,
      rmdAmount: actualRMD,
      taxesPaid: taxes,
      netDistribution: netDist,
      endBalance: end,
      cumulativeTaxes,
      afterTaxWealth: end + cumulativeNetDist,
      cumulativeNetDistributions: cumulativeNetDist,
    })

    balance = end
  }

  return rows
}

function projectRothFromIRA(inputs: PlanInputs): RothFromIRAYearData[] {
  const rows: RothFromIRAYearData[] = []
  const taxRate = effectiveTaxRate(inputs)
  const taxDue = inputs.conversionAmount * taxRate
  const initialRothBalance = inputs.conversionAmount - taxDue
  const g = inputs.growthRate
  const cumulativeTaxesPaid = taxDue

  let balance = inputs.initialBalance

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    if (age === inputs.conversionAge) {
      balance = initialRothBalance
    }
    const begin = balance
    const growth = begin * g
    const end = begin + growth

    rows.push({
      age,
      beginBalance: begin,
      growth,
      endBalance: end,
      cumulativeTaxesPaid,
      afterTaxWealth: end,
    })

    balance = end
  }

  return rows
}

function projectRothFromCash(inputs: PlanInputs): RothFromCashYearData[] {
  const rows: RothFromCashYearData[] = []
  const taxRate = effectiveTaxRate(inputs)
  const taxDue = inputs.conversionAmount * taxRate
  const g = inputs.growthRate

  let balance = inputs.initialBalance

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    if (age === inputs.conversionAge) {
      balance = inputs.conversionAmount
    }
    const begin = balance
    const growth = begin * g
    const end = begin + growth

    rows.push({
      age,
      beginBalance: begin,
      growth,
      endBalance: end,
      taxPaidFromCash: age === inputs.conversionAge ? taxDue : 0,
      cumulativeTaxesPaid: taxDue,
      afterTaxWealth: end,
    })

    balance = end
  }

  return rows
}

function findBreakeven(
  traditional: TraditionalYearData[],
  roth: RothFromIRAYearData[] | RothFromCashYearData[],
): number | null {
  for (let i = 0; i < traditional.length; i++) {
    if (roth[i].afterTaxWealth > traditional[i].afterTaxWealth) {
      return traditional[i].age
    }
  }
  return null
}

export function runProjection(inputs: PlanInputs): ProjectionResults {
  const traditional = projectTraditional(inputs)
  const rothFromIRA = projectRothFromIRA(inputs)
  const rothFromCash = projectRothFromCash(inputs)

  return {
    traditional,
    rothFromIRA,
    rothFromCash,
    breakevenB: findBreakeven(traditional, rothFromIRA),
    breakevenC: findBreakeven(traditional, rothFromCash),
    inputs,
  }
}
