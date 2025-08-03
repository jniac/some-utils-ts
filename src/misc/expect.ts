
export function expectNumber(
  value: any,
  {
    allowNaN = false,
  } = {}
): number {
  if (typeof value !== 'number' || (isNaN(value) && !allowNaN)) {
    throw new TypeError(`Expected a number, got ${typeof value}`)
  }
  return value
}
