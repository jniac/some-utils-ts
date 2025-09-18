import { describe, expect, test } from 'vitest'

import { UniqueValueMap } from './unique-value-map'

describe('UniqueValueMap', () => {
  test('should associate a value with a key', () => {
    const map = new UniqueValueMap<string, number>()
    map.set('a', 1)
    expect(map.hasValue(1)).toBe(true)
    expect(map.sizeOf('a')).toBe(1)
    expect(map.getKey(1)).toBe('a')
    expect(map.valueAt('a', 0)).toBe(1)
  })

  test('should delete a value', () => {
    const map = new UniqueValueMap<string, number>()
    map.set('a', 1)
    map.set('a', 2)
    expect(map.sizeOf('a')).toBe(2)
    expect(map.delete(1)).toBe(true)
    expect(map.getKey(1)).toBeUndefined()
    expect(map.sizeOf('a')).toBe(1)
  })

  test('should reassign a value to a different key', () => {
    const map = new UniqueValueMap<string, number>()
    map.set('a', 1)
    map.set('b', 1) // Reassign value 1 to key 'b'
    expect(map.getKey(1)).toBe('b')
    expect(map.sizeOf('a')).toBe(0)
    expect(map.getKey(2)).toBeUndefined()
  })

  test('should allow multiple values for a single key', () => {
    const map = new UniqueValueMap<string, number>()
    map.set('a', 1)
    map.set('a', 2)
    expect(map.sizeOf('a')).toBe(2)
    expect(map.getKey(1)).toBe('a')
    expect(map.getKey(2)).toBe('a')
    expect([...map.valuesOf('a')]).toEqual([1, 2])
    expect([...map.valuesOf('b')]).toEqual([])
    expect([...map.entriesOf('a')]).toEqual([[0, 1], [1, 2]])
  })

  test('should clear all mappings', () => {
    const map = new UniqueValueMap<string, number>()
    map.set('a', 1)
    map.set('b', 2)
    expect(map.sizeOf('a')).toBe(1)
    expect(map.sizeOf('b')).toBe(1)
    map.clear()
    expect(map.sizeOf('a')).toBe(0)
    expect(map.sizeOf('b')).toBe(0)
  })

  test('should handle non-existent keys and values gracefully', () => {
    const map = new UniqueValueMap<string, number>()
    expect(map.getKey(99)).toBeUndefined()
    expect(map.sizeOf('nonexistent')).toBe(0)
    expect(map.delete(99)).toBe(false)
  })

  describe('value management', () => {
    const map = new UniqueValueMap<string, number>()
    map.set('a', 1)
    map.set('a', 2)
    map.set('a', 3)

    test('should allow to get index of a value in its key set', () => {
      expect(map.indexOf('a', 1)).toBe(0)
      expect(map.indexOf('a', 2)).toBe(1)
      expect(map.indexOf('a', 3)).toBe(2)
      expect(map.indexOf('a', 99)).toBe(-1)
      expect(map.indexOf('b', 1)).toBe(-1)
    })

    test('should allow to move a value to a different index in its key set', () => {
      expect([...map.valuesOf('a')]).toEqual([1, 2, 3])

      expect(map.moveBy('a', 2, 1)).toBe(true) // Move '2' forward by 1
      expect([...map.valuesOf('a')]).toEqual([1, 3, 2])

      expect(map.moveBy('a', 2, 1)).toBe(false) // No move (already at end)

      expect(map.moveTo('a', 3, 0)).toBe(true) // Move '3' to index 0
      expect([...map.valuesOf('a')]).toEqual([3, 1, 2])
    })

    test('should allow to sort values within a key', () => {
      map.sort('a', (a, b) => a - b) // Sort ascending
      expect([...map.valuesOf('a')]).toEqual([1, 2, 3])
    })
  })
})