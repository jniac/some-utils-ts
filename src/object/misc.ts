
export function withoutUndefined<T extends Record<string, any>>(object: T): Partial<T> {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined)) as Partial<T>
}
