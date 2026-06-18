export interface PlanInputs {
  currentAge: number
  endAge: number
  initialBalance: number
  growthRate: number
  federalTaxRate: number
  stateTaxRate: number
  rmdStartAge: number
  conversionAmount: number
  conversionAge: number
}

export interface TraditionalYearData {
  age: number
  beginBalance: number
  growth: number
  rmdAmount: number              // IRS-required minimum only
  totalWithdrawal: number        // max(rmd, distributionTarget) — actual taken
  taxesPaid: number
  netDistribution: number
  endBalance: number
  cumulativeTaxes: number
  afterTaxWealth: number         // endBalance*(1-taxRate) + cumulativeNetDistributions
  cumulativeNetDistributions: number
}

export interface RothFromIRAYearData {
  age: number
  tradBalance: number            // remaining Traditional IRA
  rothBalance: number            // Roth IRA
  beginBalance: number           // tradBalance + rothBalance at year start
  growth: number
  rmdAmount: number              // RMD from remaining Traditional portion
  taxesPaid: number
  netDistribution: number        // after-tax cash received (trad net + Roth withdrawal)
  endBalance: number             // tradBalance + rothBalance at year end
  cumulativeTaxesPaid: number
  afterTaxWealth: number         // rothBalance + tradBalance*(1-taxRate) + cumulativeNetDist
  cumulativeNetDistributions: number
}

export interface RothFromCashYearData {
  age: number
  tradBalance: number
  rothBalance: number
  beginBalance: number
  growth: number
  rmdAmount: number
  taxesPaid: number
  netDistribution: number
  endBalance: number
  taxPaidFromCash: number        // conversion tax paid externally (non-zero only at conversion age)
  cumulativeTaxesPaid: number
  afterTaxWealthGross: number    // before netting out external cash tax cost
  afterTaxWealth: number         // gross - totalCashTaxPaid (net, used for comparisons)
  cumulativeNetDistributions: number
}

export interface ProjectionResults {
  traditional: TraditionalYearData[]
  rothFromIRA: RothFromIRAYearData[]
  rothFromCash: RothFromCashYearData[]
  breakevenB: number | null
  breakevenC: number | null
  inputs: PlanInputs
  distInputs: DistributionInputs
}

export interface MonteCarloResult {
  age: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface MonteCarloResults {
  traditional: MonteCarloResult[]
  rothFromCash: MonteCarloResult[]
  runs: number
}

export interface DistributionInputs {
  monthlyDistribution: number
  distributionIncreaseRate: number
  distributionStartAge: number
  enabled: boolean
}

export interface DistYearData {
  age: number
  beginBalance: number
  annualDistribution: number
  monthlyEquivalent: number
  growth: number
  endBalance: number
  cumulativeDistributions: number
  depleted: boolean
}

export interface CRMClient {
  id: string
  name: string
  email: string
  phone: string
  notes: string
  lastUpdated: string
  savedInputs: PlanInputs
  savedDistInputs: DistributionInputs
}

export interface ReportMeta {
  clientName: string
  advisorName: string
  firmName: string
  disclosureText: string
}

export const DEFAULT_INPUTS: PlanInputs = {
  currentAge: 65,
  endAge: 100,
  initialBalance: 2_000_000,
  growthRate: 0.06,
  federalTaxRate: 0.37,
  stateTaxRate: 0.00,
  rmdStartAge: 73,
  conversionAmount: 2_000_000,
  conversionAge: 65,
}

export const DEFAULT_DIST_INPUTS: DistributionInputs = {
  monthlyDistribution: 10_000,
  distributionIncreaseRate: 0.03,
  distributionStartAge: 65,
  enabled: true,
}
