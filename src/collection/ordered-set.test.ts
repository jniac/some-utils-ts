import { describe, expect, test } from 'vitest'

import { OrderedSet } from './ordered-set'

describe('OrderedSet', () => {
  test('should add and check items', () => {
    const set = new OrderedSet<number>()
    expect(set.add(1)).toBe(true)
    expect(set.add(2)).toBe(true)
    expect(set.add(1)).toBe(false) // Duplicate
    expect(set.has(1)).toBe(true)
    expect(set.has(3)).toBe(false)
    expect(set.size).toBe(2)
  })

  test('should remove items', () => {
    const set = new OrderedSet<number>()
    set.add(1)
    set.add(2)
    expect(set.remove(1)).toBe(true)
    expect(set.remove(3)).toBe(false) // Not found
    expect(set.has(1)).toBe(false)
    expect(set.size).toBe(1)
  })

  test('should get index and item at index', () => {
    const set = new OrderedSet<number>()
    set.add(10)
    set.add(20)
    expect(set.indexOf(10)).toBe(0)
    expect(set.indexOf(20)).toBe(1)
    expect(set.indexOf(30)).toBe(-1) // Not found
    expect(set.at(0)).toBe(10)
    expect(set.at(1)).toBe(20)
    expect(set.at(2)).toBeUndefined() // Out of bounds
  })

  test('should maintain order of items', () => {
    const set = new OrderedSet<number>()
    set.add(3)
    set.add(1)
    set.add(2)
    expect([...set]).toEqual([3, 1, 2]) // Accessing private field for test purposes
  })

  describe('value management', () => {
    const set = new OrderedSet<number>()
    set.add(1)
    set.add(2)
    set.add(3)
    set.add(4)
    set.add(5)

    test('should allow to move an item by delta', () => {
      expect(set.moveBy(3, -2)).toBe(0) // Move 3 to index 0
      expect([...set]).toEqual([3, 1, 2, 4, 5])
      expect(set.moveBy(4, 1)).toBe(4) // Move 4 to index 4
      expect([...set]).toEqual([3, 1, 2, 5, 4])
      expect(set.moveBy(1, 10)).toBe(4) // Move 1 to end
      expect([...set]).toEqual([3, 2, 5, 4, 1])
      expect(set.moveBy(6, 1)).toBe(-1) // Item not found
      expect([...set]).toEqual([3, 2, 5, 4, 1])
    })

    test('should allow to move an item to a specific index', () => {
      expect(set.moveTo(2, 0)).toBe(0) // Move 2 to index 0
      expect([...set]).toEqual([2, 3, 5, 4, 1])
      expect(set.moveTo(5, 2)).toBe(2) // Move 5 to index 2
      expect([...set]).toEqual([2, 3, 5, 4, 1])
      expect(set.moveTo(1, -1)).toBe(4) // Move 1 to last index
      expect([...set]).toEqual([2, 3, 5, 4, 1])
      expect(set.moveTo(6, 1)).toBe(-1) // Item not found
      expect([...set]).toEqual([2, 3, 5, 4, 1])
    })

    test('should sort items', () => {
      set.sort((a, b) => a - b)
      expect([...set]).toEqual([1, 2, 3, 4, 5])
    })
  })
})