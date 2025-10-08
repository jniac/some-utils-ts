import { Hash } from '../hash'

const weakMap = new WeakMap()
const map = new Map()

export function invalidCache(ref: any, ...args: any[]): boolean {
  const hash = Hash.compute(...args)

  const isObject = typeof ref === 'object' && ref !== null

  const cachedHash = isObject
    ? weakMap.get(ref)
    : map.get(ref)

  if (cachedHash === hash)
    return false

  if (isObject)
    weakMap.set(ref, hash)
  else
    map.set(ref, hash)

  return true
}
