
export function parseFloat(value: any, defaultValue: number) {
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? defaultValue : parsed
}
