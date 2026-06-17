export function fmt(value: number, decimals = 0): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(decimals === 0 ? 2 : decimals)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(decimals === 0 ? 1 : decimals)}K`
  }
  return `$${value.toFixed(decimals)}`
}

export function fmtFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function fmtPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function axisFmt(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}
