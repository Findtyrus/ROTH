export const IRS_UNIFORM_LIFETIME_TABLE: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9,
  78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7,
  84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9,
  90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5,  95: 8.9,
  96: 8.4,  97: 7.8,  98: 7.3,  99: 6.8,  100: 6.4,
}

export function getRMDDivisor(age: number, rmdStartAge: number): number {
  if (age < rmdStartAge) return Infinity
  const tableAge = Math.min(Math.max(age, 72), 100)
  return IRS_UNIFORM_LIFETIME_TABLE[tableAge] ?? 6.4
}

export function calculateRMD(
  priorYearEndBalance: number,
  age: number,
  rmdStartAge: number,
): number {
  const divisor = getRMDDivisor(age, rmdStartAge)
  if (divisor === Infinity) return 0
  return priorYearEndBalance / divisor
}
