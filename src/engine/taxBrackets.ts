export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household'

interface TaxBracket {
  rate: number
  min: number
  max: number
}

// 2025 federal income tax brackets (TCJA inflation-adjusted)
const BRACKETS_2025: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { rate: 0.10, min: 0, max: 11_925 },
    { rate: 0.12, min: 11_925, max: 48_475 },
    { rate: 0.22, min: 48_475, max: 103_350 },
    { rate: 0.24, min: 103_350, max: 197_300 },
    { rate: 0.32, min: 197_300, max: 250_525 },
    { rate: 0.35, min: 250_525, max: 626_350 },
    { rate: 0.37, min: 626_350, max: Infinity },
  ],
  married_joint: [
    { rate: 0.10, min: 0, max: 23_850 },
    { rate: 0.12, min: 23_850, max: 96_950 },
    { rate: 0.22, min: 96_950, max: 206_700 },
    { rate: 0.24, min: 206_700, max: 394_600 },
    { rate: 0.32, min: 394_600, max: 501_050 },
    { rate: 0.35, min: 501_050, max: 751_600 },
    { rate: 0.37, min: 751_600, max: Infinity },
  ],
  married_separate: [
    { rate: 0.10, min: 0, max: 11_925 },
    { rate: 0.12, min: 11_925, max: 48_475 },
    { rate: 0.22, min: 48_475, max: 103_350 },
    { rate: 0.24, min: 103_350, max: 197_300 },
    { rate: 0.32, min: 197_300, max: 250_525 },
    { rate: 0.35, min: 250_525, max: 375_800 },
    { rate: 0.37, min: 375_800, max: Infinity },
  ],
  head_of_household: [
    { rate: 0.10, min: 0, max: 17_000 },
    { rate: 0.12, min: 17_000, max: 64_850 },
    { rate: 0.22, min: 64_850, max: 103_350 },
    { rate: 0.24, min: 103_350, max: 197_300 },
    { rate: 0.32, min: 197_300, max: 250_500 },
    { rate: 0.35, min: 250_500, max: 626_350 },
    { rate: 0.37, min: 626_350, max: Infinity },
  ],
}

function taxOnIncome(income: number, status: FilingStatus): number {
  let tax = 0
  for (const b of BRACKETS_2025[status]) {
    if (income <= b.min) break
    tax += (Math.min(income, b.max) - b.min) * b.rate
  }
  return tax
}

function bracketAt(income: number, status: FilingStatus): TaxBracket {
  const brackets = BRACKETS_2025[status]
  for (const b of brackets) {
    if (income < b.max) return b
  }
  return brackets[brackets.length - 1]
}

export interface BracketBreakdown {
  rate: number
  min: number
  max: number
  amountInBracket: number
  taxInBracket: number
}

export interface ConversionTaxResult {
  bracketBeforeConversion: number
  bracketAfterConversion: number
  federalTaxOnConversion: number
  stateTaxOnConversion: number
  totalTaxOnConversion: number
  effectiveRateOnConversion: number
  pushedIntoHigherBracket: boolean
  bracketBreakdown: BracketBreakdown[]
}

// Stacking method: tax(existing + conversion) - tax(existing)
// Verification: existingIncome=$80k, conversion=$750k, MFJ, state=0% → federal ≈ $222,039.50
export function calculateConversionTax(
  existingIncome: number,
  conversionAmount: number,
  filingStatus: FilingStatus,
  stateRate = 0,
): ConversionTaxResult {
  const totalIncome = existingIncome + conversionAmount
  const federalTaxOnConversion = taxOnIncome(totalIncome, filingStatus) - taxOnIncome(existingIncome, filingStatus)
  const stateTaxOnConversion = conversionAmount * stateRate
  const totalTaxOnConversion = federalTaxOnConversion + stateTaxOnConversion
  const effectiveRateOnConversion = conversionAmount > 0 ? totalTaxOnConversion / conversionAmount : 0

  const before = bracketAt(Math.max(existingIncome, 0), filingStatus)
  const after = bracketAt(Math.max(totalIncome - 1, 0), filingStatus)

  const breakdown: BracketBreakdown[] = []
  for (const b of BRACKETS_2025[filingStatus]) {
    const start = Math.max(existingIncome, b.min)
    const end = Math.min(totalIncome, b.max)
    if (start < end) {
      const amountInBracket = end - start
      breakdown.push({ rate: b.rate, min: b.min, max: b.max, amountInBracket, taxInBracket: amountInBracket * b.rate })
    }
  }

  return {
    bracketBeforeConversion: before.rate,
    bracketAfterConversion: after.rate,
    federalTaxOnConversion,
    stateTaxOnConversion,
    totalTaxOnConversion,
    effectiveRateOnConversion,
    pushedIntoHigherBracket: after.rate > before.rate,
    bracketBreakdown: breakdown,
  }
}

export interface BracketPosition {
  currentRate: number
  topOfBracket: number
  roomToNextBracket: number
  nextBracketRate: number | null
  nextBracketWidth: number | null
}

export function getBracketPosition(existingIncome: number, filingStatus: FilingStatus): BracketPosition {
  const brackets = BRACKETS_2025[filingStatus]
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i]
    if (existingIncome < b.max) {
      const next = i + 1 < brackets.length ? brackets[i + 1] : null
      const roomToNext = b.max === Infinity ? 0 : b.max - existingIncome
      const nextWidth = next && next.max !== Infinity ? next.max - b.max : null
      return {
        currentRate: b.rate,
        topOfBracket: b.max,
        roomToNextBracket: roomToNext,
        nextBracketRate: next ? next.rate : null,
        nextBracketWidth: nextWidth,
      }
    }
  }
  // Already at or above top bracket
  const last = brackets[brackets.length - 1]
  return {
    currentRate: last.rate,
    topOfBracket: Infinity,
    roomToNextBracket: 0,
    nextBracketRate: null,
    nextBracketWidth: null,
  }
}

export function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return BRACKETS_2025[filingStatus]
}
