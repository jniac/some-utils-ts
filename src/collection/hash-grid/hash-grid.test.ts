import { describe, expect, test } from 'vitest'
import { HashGrid2 } from './hash-grid'
import hash2Collision from './hash2.collisions.json'

describe('HashGrid2', () => {
  test('should set and get values', () => {
    const grid = new HashGrid2<string>()
    grid.set(1, 2, 'a')
    grid.set(102332, Math.PI, 'b')
    expect(grid.get(1, 2)).toBe('a')
    expect(grid.get(102332, Math.PI)).toBe('b')
  })

  const { p0: [x0, y0], p1: [x1, y1] } = hash2Collision.random[0]

  test('should handle hash collisions', () => {
    const grid = new HashGrid2<string>()
    grid.set(x0, y0, 'collision-0')
    grid.set(x1, y1, 'collision-1')
    expect(grid.get(x0, y0)).toBe('collision-0')
    expect(grid.get(x1, y1)).toBe('collision-1')
    expect(grid.size).toBe(2) // Two unique entries
    expect(grid.mapSize).toBe(1) // Only one entry in the map because of collision
  })

  test('delete should delete, collision or not', () => {
    const grid = new HashGrid2<string>()
    grid.set(10, 20, 'a')
    grid.delete(10, 20)
    expect(grid.get(10, 20)).toBeUndefined()
    expect(grid.size).toBe(0)

    grid.set(x0, y0, 'collision-0')
    grid.set(x1, y1, 'collision-1')
    grid.delete(x0, y0)
    expect(grid.get(x0, y0)).toBeUndefined()
    expect(grid.get(x1, y1)).toBe('collision-1')
    expect(grid.size).toBe(1)
    expect(grid.mapSize).toBe(1)
    grid.delete(x1, y1)
    expect(grid.get(x1, y1)).toBeUndefined()
    expect(grid.size).toBe(0)
    expect(grid.mapSize).toBe(0)
  })
})
