import { DeepPartial } from '../../types'
import { isObject } from '../common'
import { Path, deepGet, deepSet, deepWalk } from './deep'

export class DeepDiffResult<TypeA = any, TypeB = any> {
  objectA: TypeA
  objectB: TypeB
  aOnlyChanges: [Path, value: any][] = []
  bOnlyChanges: [Path, value: any][] = []
  bothChanges: [Path, aValue: any, bValue: any][] = []

  get totalChangeCount() {
    return this.aOnlyChanges.length + this.bOnlyChanges.length + this.bothChanges.length
  }

  get aChangeCount() {
    return this.aOnlyChanges.length + this.bothChanges.length
  }

  get bChangeCount() {
    return this.bOnlyChanges.length + this.bothChanges.length
  }

  /**
   * Returns an object containing only the changes in `objectA`.
   * 
   * Shortcut for `getAChangeObject()`.
   */
  get a() {
    return this.getAChangeObject()
  }

  /**
   * Returns an object containing only the changes in `objectB`.
   * 
   * Shortcut for `getBChangeObject()`.
   */
  get b() {
    return this.getBChangeObject()
  }

  constructor(objectA: TypeA, objectB: TypeB) {
    this.objectA = objectA
    this.objectB = objectB
  }

  *getAChanges() {
    for (const [path, value] of this.aOnlyChanges) {
      yield [path, value]
    }
    for (const [path, aValue, _] of this.bothChanges) {
      yield [path, aValue]
    }
  }

  getAChangeObject() {
    const object = {}
    for (const [path, value] of this.getAChanges()) {
      deepSet(object, path, value, { createAscendants: true })
    }
    return object as DeepPartial<TypeA>
  }

  *getBChanges() {
    for (const [path, value] of this.bOnlyChanges) {
      yield [path, value]
    }
    for (const [path, _, bValue] of this.bothChanges) {
      yield [path, bValue]
    }
  }

  getBChangeObject() {
    const object = {}
    for (const [path, value] of this.getBChanges()) {
      deepSet(object, path, value, { createAscendants: true })
    }
    return object as DeepPartial<TypeB>
  }

  info() {
    const lines = [
      `Total changes: ${this.totalChangeCount}`,
      `  Both changes (${this.bothChanges.length})`,
      ...this.bothChanges.map(([path, aValue, bValue]) => `    ${path.join('.')} = ${aValue} → ${bValue}`),
      '',
      `  A only changes (${this.aOnlyChanges.length})`,
      ...this.aOnlyChanges.map(([path, value]) => `    ${path.join('.')} = ${value}`),
      '',
      `  B only changes (${this.bOnlyChanges.length})`,
      ...this.bOnlyChanges.map(([path, value]) => `    ${path.join('.')} = ${value}`),
    ]
    return lines.join('\n')
  }
}

/**
 * Compares two objects deeply and returns the differences in a diff object.
 * 
 * NOTE:
 * - `differences` is the total number of differences.
 * - `aDifferences` is the number of differences in `objectA`.
 * - `bDifferences` is the number of differences in `objectB`.
 * - `differences !== aDifferences + bDifferences` because some differences may be common.
 */
export function deepDiff<TypeA, TypeB>(objectA: TypeA, objectB: TypeB) {
  const diff = new DeepDiffResult(objectA, objectB)

  deepWalk(objectA, {
    constructedAsValue: false, // F***ing important! Since we are comparing the final primitive values.
    onValue(aValue, path) {
      const { value: bValue, exists } = deepGet(objectB, path)
      if (!exists || aValue !== bValue) {
        if (!exists) {
          diff.aOnlyChanges.push([path, aValue])
        } else {
          diff.bothChanges.push([path, aValue, bValue])
        }
      }
    },
  })

  deepWalk(objectB, {
    constructedAsValue: false, // F***ing important! Since we are comparing the final primitive values.
    onValue(bValue, path) {
      const { value: aValue, exists } = deepGet(objectA, path)
      if (!exists || bValue !== aValue) {
        if (!exists) {
          diff.bOnlyChanges.push([path, bValue])
        } else {
          // Nothing... (Do not push change paths twice).
        }
      }
    },
  })

  return diff
}

export function deepEqual<TypeA, TypeB>(objectA: TypeA, objectB: TypeB): boolean {
  const aIsObject = isObject(objectA)
  const bIsObject = isObject(objectB)
  if (!aIsObject || !bIsObject) {
    // @ts-ignore
    return objectA === objectB
  }
  const diff = deepDiff(objectA, objectB)
  return diff.totalChangeCount === 0
}
