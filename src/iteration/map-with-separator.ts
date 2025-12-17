/**
 * Maps each item in an iterable to a new value, inserting a separator value between each pair of items.
 * 
 * Notes:
 * - The index passed to the `map` and `separator` functions is the index in the resulting array (max: 2 * items.length - 1).
 */
export function mapWithSeparator<T, U>(
  items: Iterable<T>,
  map: (item: T, index: number, originalIndex: number) => U,
  separator: (info: { index: number, left: T, right: T }) => U,
): U[] {
  const result: U[] = []
  let index = 0
  let originalIndex = 0
  let it = items[Symbol.iterator]()
  let current = it.next()
  let previous: T | undefined = undefined
  if (!current.done) {
    result.push(map(current.value, index, originalIndex))
    index++
    previous = current.value
    current = it.next()
  }
  while (!current.done) {
    result.push(separator({ index, left: previous!, right: current.value }))
    index++
    result.push(map(current.value, index, originalIndex))
    originalIndex++
    index++
    previous = current.value
    current = it.next()
  }
  return result
}
