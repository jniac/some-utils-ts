
export function isObject(value: any): value is Record<string | number | symbol, any> {
  return value !== null && typeof value === 'object'
}

export function isRecord<TKey extends string | number | symbol = string, TValue = any>(
  value: any,
): value is Record<TKey, TValue> {
  return isObject(value) && Array.isArray(value) === false
}
