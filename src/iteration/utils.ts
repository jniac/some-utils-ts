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

/**
 * Split an array into multiple arrays based on a predicate.
 * 
 * Warning: 
 * - If `count` is provided, the result will be an array of arrays with the length 
 * of `count`, where each array contains the values that match the predicate.
 * 
 * - If `count` is not provided, the result will be an array of arrays where there
 * may be `undefined` values if there are no values that match the predicate.
 */
export function distribute<T>(array: T[], predicate: (value: T) => number): (T[] | undefined)[]
export function distribute<T>(array: T[], predicate: (value: T) => number, count: number): T[][]
export function distribute<T>(array: T[], predicate: (value: T) => number, count?: number): T[][] {
  const result: T[][] = []
  function create(index: number) {
    const array: T[] = []
    result[index] = array
    return array
  }
  if (count !== undefined) {
    for (let i = 0; i < count; i++) {
      create(i)
    }
  }
  for (const value of array) {
    const index = predicate(value)
    const subArray = result[index] ?? create(index)
    subArray.push(value)
  }
  return result
}

/**
 * Allows you to iterate over pairs of values in an iterable.
 * 
 * Usage:
 * ```
 * for (const [a, b] of pairwise([1, 2, 3, 4])) {
 *   console.log(a, b) // 1 2, 2 3, 3 4
 * }
 * ```
 */
export function* pairwise<T>(values: Iterable<T>): Generator<[T, T]> {
  let prev: T | undefined = undefined
  for (const value of values) {
    if (prev !== undefined) {
      yield [prev, value]
    }
    prev = value
  }
}

export function findMaxBy<T>(items: Iterable<T>, score: (item: T) => number) {
  let bestItem: T | undefined
  let bestScore = -Infinity
  for (const item of items) {
    const currentScore = score(item)
    if (currentScore > bestScore) {
      bestScore = currentScore
      bestItem = item
    }
  }
  return bestItem
}

export function uniqueBy<T>(keyFn: (item: T) => any): (item: T) => boolean {
  const seen = new Set<any>()
  return item => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }
}

export function groupBy<K extends string | number | symbol, T>(
  keyFn: (item: T) => K,
  items: Iterable<T>
): Record<K, T[]> {
  const record = {} as Record<K, T[]>
  for (const item of items) {
    const key = keyFn(item)
    if (!record[key])
      record[key] = []
    record[key].push(item)
  }
  return record
}