
/**
 * Returns a new object with the same keys as the input object, as pure getters.
 * 
 * @param object The object to wrap.
 * @param filter A delegate to filter the keys that should be wrapped.
 */
export function withGetters<T extends Record<string, any>, K extends keyof T>(object: T): Readonly<T>
export function withGetters<T extends Record<string, any>, K extends keyof T>(object: T, filter: (key: K) => boolean): Partial<T>
export function withGetters<T extends Record<string, any>, K extends keyof T>(object: T, filter = (key: K) => true): any {
  const result = {}
  Object.keys(object).forEach((key) => {
    if (filter(key as K)) {
      Object.defineProperty(result, key, {
        get: () => object[key as keyof T],
        enumerable: true,
        configurable: false,
      })
    }
  })
  return result as any
}

export function omitUndefined<T extends Record<string, any>>(object: T): Partial<T> {
  return Object.fromEntries(Object
    .entries(object)
    .filter(([, value]) => value !== undefined)) as any
}

/**
 * @deprecated Use `omitUndefined` instead.
 */
export const withoutUndefined = omitUndefined

export function omit<T extends Record<string, any>, K extends keyof T>(object: T, ...keys: K[]): Omit<T, K> {
  return Object.fromEntries(Object
    .entries(object)
    .filter(([key]) => !keys.includes(key as K))) as any
}

export function omitWithGetters<T extends Record<string, any>, K extends keyof T>(object: T, ...keys: K[]): Omit<T, K> {
  return withGetters(object, key => !keys.includes(key as K)) as any
}

export function pick<T extends object, K extends keyof T>(source: T, ...keys: K[]): Pick<T, K> {
  return Object.fromEntries(Object
    .entries(source)
    .filter(([key]) => keys.includes(key as any))) as any
}

export function pickWithGetters<T extends object, K extends keyof T>(source: T, ...keys: K[]): Pick<T, K> {
  return withGetters(source, key => keys.includes(key as K)) as any
}
