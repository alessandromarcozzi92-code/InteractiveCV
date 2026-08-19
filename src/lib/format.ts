export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function formatPeriod(from: string, to: string): string {
  return `${from} → ${to}`
}
