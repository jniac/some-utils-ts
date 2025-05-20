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
    expect(grid.valueCount).toBe(2) // Two unique entries
    expect(grid.cellCount).toBe(1) // Only one entry in the map because of collision
  })

  test('delete should delete, collision or not', () => {
    const grid = new HashGrid2<string>()
    grid.set(10, 20, 'a')
    grid.delete(10, 20)
    expect(grid.get(10, 20)).toBeUndefined()
    expect(grid.valueCount).toBe(0)

    grid.set(x0, y0, 'collision-0')
    grid.set(x1, y1, 'collision-1')
    grid.delete(x0, y0)
    expect(grid.get(x0, y0)).toBeUndefined()
    expect(grid.get(x1, y1)).toBe('collision-1')
    expect(grid.valueCount).toBe(1)
    expect(grid.cellCount).toBe(1)
    grid.delete(x1, y1)
    expect(grid.get(x1, y1)).toBeUndefined()
    expect(grid.valueCount).toBe(0)
    expect(grid.cellCount).toBe(0)
  })

  test('cellSize should group values into cells', () => {
    const grid = new HashGrid2<string>(10)
    grid.set(1, 2, 'a')
    grid.set(3, 4, 'b')
    grid.set(5, 6, 'c')
    expect(grid.hasCell(5, 5)).toBe(true)
    expect(grid.hasCell(15, 15)).toBe(false)
    expect(grid.get(1, 2)).toBe('a')
    expect(grid.get(3, 4)).toBe('b')
    expect(grid.get(5, 6)).toBe('c')
    expect(grid.valueCount).toBe(3) // Three unique entries
    expect(grid.cellCount).toBe(1) // Only one entry in the map because of cell size
    expect([...grid.cellValues(1, 1)]).toEqual([...'abc'])
  })

  test('iterate over values', () => {
    const entries = [
      [1, 2, 'a'],
      [30, 40, 'b'],
      [-5, -6, 'd'],
      [5, 6, 'c'],
    ] as const
    const grid = new HashGrid2<string>()
    for (const [x, y, v] of entries) {
      grid.set(x, y, v)
    }
    const values = [...grid.values()]
    expect(values).containSubset(entries.map(([x, y, v]) => v))
    expect(values.length).toBe(4)

    const ok = grid
      .mapEntries((x, y, v) => !!entries.find(([x2, y2, v2]) => x === x2 && y === y2 && v === v2))
      .every(v => v)
    expect(ok).toBe(true)
  })
})
