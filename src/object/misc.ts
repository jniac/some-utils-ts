
export function withoutUndefined<T extends Record<string, any>>(object: T): Partial<T> {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined)) as Partial<T>
}

export function omit<T extends Record<string, any>, K extends keyof T>(object: T, ...keys: K[]): Omit<T, K> {
  return Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>
}
