import { describe, expect, test } from 'vitest'

import { OneToMany } from './one-to-many'

describe('OneToMany', () => {
  const runTests = (reverseMapping: boolean) => {
    describe(reverseMapping ? 'reverse mapping' : '', () => {
      test('should associate multiple values with a single key', () => {
        const map = new OneToMany<string, number>(reverseMapping)
        map.add("a", 1)
        map.add("a", 2)

        expect(map.getValues("a")).toEqual(new Set([1, 2]))
      })

      test('should correctly retrieve keys', () => {
        const map = new OneToMany<string, number>(reverseMapping)
        map.add("x", 10)
        map.add("y", 10)

        expect(map.getKeys(10)).toEqual(new Set(["x", "y"]))
      })

      test('should delete a key and its values', () => {
        const map = new OneToMany<string, number>(reverseMapping)
        map.add("a", 1)
        map.add("a", 2)

        expect(map.deleteKey("a")).toBe(true)
        expect(map.getValues("a")).toBeUndefined()
      })

      test('should delete a value from all associated keys', () => {
        const map = new OneToMany<string, number>(reverseMapping)
        map.add("a", 1)
        map.add("b", 1)

        expect(map.deleteValue(1)).toBe(true)
        expect(map.getValues("a")).toBeUndefined()
        expect(map.getValues("b")).toBeUndefined()
      })

      test('should check for key and value existence', () => {
        const map = new OneToMany<string, number>(reverseMapping)
        map.add("x", 10)

        expect(map.hasKey("x")).toBe(true)
        expect(map.hasValue(10)).toBe(true)
        expect(map.hasKey("y")).toBe(false)
        expect(map.hasValue(99)).toBe(false)
      })

      test('should clear all mappings', () => {
        const map = new OneToMany<string, number>(reverseMapping)
        map.add("a", 1)
        map.add("b", 2)

        map.clear()
        expect(map.keyCount()).toBe(0)
        expect(map.valueCount()).toBe(0)
      })
    })
  }

  runTests(false)
  runTests(true)
})
