/**
 * Deep recursive check of "equivalence".
 * 
 * "equivalence" means:
 * - if primitives:
 *   - same values
 * - otherwise:
 *   - if arrays:
 *     - same lengths & "equivalent" values by index
 *   - if objects:
 *     - same number of props, with same name, with "equivalent" values
 * 
 * NOTE: 
 * - No support for Set, Map (& weak equivalent) for the moment!
 * - Only enumerable keys are taken into account (Object.keys()).
 */
export function areEquivalent(a: any, b: any) {
  if (a === b) {
    return true
  }
  const type = typeof a
  if (type !== typeof b) {
    return false
  }
  if (type === 'number') {
    return Number.isNaN(a) && Number.isNaN(b)
  }
  if (type !== 'object') {
    return false
  }
  if (a === null) {
    return false
  }

  // From now, "a" & "b" are objects.

  // Are they arrays?
  if (Array.isArray(a)) {
    if (Array.isArray(b) === false) {
      return false
    }
    if (a.length !== b.length) {
      return false
    }
    for (let index = 0, max = a.length; index < max; index++) {
      if (areEquivalent(a[index], b[index]) === false) {
        return false
      }
    }
    return true
  }

  // They are objects.
  const aKeys = Object.keys(a)
  const bKeys = new Set(Object.keys(b))
  if (aKeys.length !== bKeys.size) {
    return false
  }

  for (let index = 0, max = aKeys.length; index < max; index++) {
    const key = aKeys[index]
    if (bKeys.has(key) === false) {
      return false
    }
    if (areEquivalent(a[key], b[key]) === false) {
      return false
    }
  }

  return true
}

export function isEquivalentSubsetOf(subsetCandidate: any, parent: any): boolean {
  if (subsetCandidate && typeof subsetCandidate === 'object') {
    for (const key of Object.keys(subsetCandidate)) {
      if (areEquivalent(subsetCandidate[key], parent[key]) === false) {
        return false
      }
    }
    return true
  }
  return false
}