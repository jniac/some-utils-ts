
export function isObject(value: any): value is Record<string | number | symbol, any> {
  return value !== null && typeof value === 'object'
}
