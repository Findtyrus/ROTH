export interface PlanInputs {
  currentAge: number;
  endAge: number;
  initialBalance: number;
  growthRate: number;
  inflationRate: number;
  federalTaxRate: number;
  stateTaxRate: number;
  capitalGainsRate: number;
  rmdStartAge: number;
  conversionAmount: number;
  conversionAge: number;
}

export interface TraditionalYearData {
  age: number;
  beginBalance: number;
  growth: number;
  rmdAmount: number;
  taxesPaid: number;
  netDistribution: number;
  endBalance: number;
  cumulativeTaxes: number;
  afterTaxWealth: number;
  cumulativeNetDistributions: number;
}

export interface RothFromIRAYearData {
  age: number;
  beginBalance: number;
  growth: number;
  endBalance: number;
  cumulativeTaxesPaid: number;
  afterTaxWealth: number;
}

export interface RothFromCashYearData {
  age: number;
  beginBalance: number;
  growth: number;
  endBalance: number;
  taxPaidFromCash: number;
  cumulativeTaxesPaid: number;
  afterTaxWealth: number;
}

export interface ProjectionResults {
  traditional: TraditionalYearData[];
  rothFromIRA: RothFromIRAYearData[];
  rothFromCash: RothFromCashYearData[];
  breakevenB: number | null;
  breakevenC: number | null;
  inputs: PlanInputs;
}

export interface MonteCarloResult {
  age: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface MonteCarloResults {
  traditional: MonteCarloResult[];
  rothFromCash: MonteCarloResult[];
  runs: number;
}

export interface DistributionInputs {
  monthlyDistribution: number;
  distributionIncreaseRate: number;
  distributionStartAge: number;
  enabled: boolean;
}

export interface DistYearData {
  age: number;
  beginBalance: number;
  annualDistribution: number;
  monthlyEquivalent: number;
  growth: number;
  endBalance: number;
  cumulativeDistributions: number;
  depleted: boolean;
}

export interface CRMClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  lastUpdated: string;
  savedInputs: PlanInputs;
  savedDistInputs: DistributionInputs;
}

export interface ReportMeta {
  clientName: string;
  advisorName: string;
  firmName: string;
  disclosureText: string;
}

export const DEFAULT_INPUTS: PlanInputs = {
  currentAge: 65,
  endAge: 100,
  initialBalance: 2_000_000,
  growthRate: 0.06,
  inflationRate: 0.00,
  federalTaxRate: 0.37,
  stateTaxRate: 0.00,
  capitalGainsRate: 0.20,
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
