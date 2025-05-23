import { describe, expect, test } from 'vitest'

import { deepSet } from './deep'
import { deepDiff } from './diff'

describe('deepSet', () => {
  test('should set deep properties with string and array paths', () => {
    const a = {
      x: {
        y: {
          z: 1,
        },
      },
    }

    deepSet(a, 'x.y.z', 2)
    expect(a.x.y.z).toBe(2)

    deepSet(a, ['x', 'y', 'z'], 3)
    expect(a.x.y.z).toBe(3)
  })

  test('should pierce through null values when allowed', () => {
    const a: any = { x: null }
    deepSet(a, 'x.y.z', 2)
    expect(a.x.y.z).toBe(2)
  })

  test('should fail to pierce through null values when disabled', () => {
    const a: any = { x: null }
    const result = deepSet(a, 'x.y.z', 2, { pierceNullOrUndefined: false })

    expect(result.success).toBe(false)
    expect(a.x).toBe(null)
  })

  test('should handle numbers and symbols as keys', () => {
    {
      const obj: any = {}
      deepSet(obj, ['x', 'y', 0], 1)
      expect(Array.isArray(obj.x.y)).toBe(true)
    }
    {
      const obj: any = {}
      deepSet(obj, ['x', 2, 0], 1)
      expect(Array.isArray(obj.x)).toBe(true)
      expect(obj.x.length).toBe(3)
      expect(Array.isArray(obj.x[2])).toBe(true)
    }
    {
      const arr: any[] = [[0, 1]]
      deepSet(arr, [0, 2, 0], 1)
      expect(Array.isArray(arr[0])).toBe(true)
    }
    {
      const obj: any = {}
      const mySymbol = Symbol('mySymbol')
      deepSet(obj, ['x', mySymbol, 2], 1)
      expect(Array.isArray(obj.x[mySymbol])).toBe(true)
    }
  })
})

describe('deepDiff', () => {
  test('should correctly compute deep differences', () => {
    const a = {
      x: 1,
      y: 2,
      z: {
        a: 3,
        b: 4,
        c: {
          d: 5,
          e: 6,
        },
      },
      r: 7,
    }
    const b = {
      x: 1,
      y: 2,
      z: {
        a: 3,
        b: 4,
        c: {
          d: 5,
          e: 7, // Changed.
        },
      },
      // r: 7, // Removed.
      q: 8, // Added.
    }

    const diff = deepDiff(a, b)

    expect(diff.a?.r).toBe(7) // r was removed
    // @ts-ignore
    expect(diff.b?.r).toBeUndefined() // Confirm r is missing in b

    expect(diff.b?.q).toBe(8) // q was added
    // @ts-ignore
    expect(diff.a?.q).toBeUndefined() // Confirm q is missing in a

    expect(diff.a?.z?.c?.e).toBe(6) // e changed
    expect(diff.b?.z?.c?.e).toBe(7)
  })
})