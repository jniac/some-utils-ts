/**
 * Same as `Array.prototype.some` but for iterables
 */
export function some<T>(values: Iterable<T>, predicate: (value: T) => boolean): boolean {
  for (const value of values) {
    if (predicate(value)) {
      return true
    }
  }
  return false
}

/**
 * Same as `Array.prototype.every` but for iterables
 */
export function every<T>(values: Iterable<T>, predicate: (value: T) => boolean): boolean {
  for (const value of values) {
    if (!predicate(value)) {
      return false
    }
  }
  return true
}
