
/**
 * TypeScript utility to iterate over the keys of an object with type safety
 * (keys are of type `keyof T`).
 * 
 * Note: Relies on Object.prototype.hasOwnProperty to ensure that only own 
 * properties are yielded.
 * 
 * Usage:
 * ```ts
 * for (const key of keysOf(obj)) {
 *   console.log(key, obj[key])
 * }
 * ```
 */
export function* keysOf<T extends object>(obj: T): Generator<keyof T> {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      yield key as keyof T
    }
  }
}

/**
 * TypeScript utility to check if a key is a valid key of an object.
 */
export function isKeyOf<T extends object>(obj: T, key: any): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key)
}
