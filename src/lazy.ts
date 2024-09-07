
const map = new WeakMap<() => any, any>()

/**
 * `lazy()` is for saving resources by waiting for a first request before 
 * initialization of the required values.
 * 
 * Usage:
 * ```
 * const resources = lazy(() => {
 *   const data = heavyProcess()
 *   return {
 *     data,
 *   }
 * })
 * // somewhere else
 * doSomethingWith(resources().data)
 * ``` 
 */
export const lazy = <T extends unknown>(callback: () => T) => {
  return (): T => {
    const value = map.get(callback)
    if (value === undefined) {
      const value = callback()
      map.set(callback, value)
      return value
    }
    return value as T
  }
}