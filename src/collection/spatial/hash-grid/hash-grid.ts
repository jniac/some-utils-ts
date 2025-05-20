import { hash2 } from './hash2'

class LinkedList2<T> {
  x: number
  y: number
  value: T
  next?: LinkedList2<T>

  constructor(x: number, y: number, value: T) {
    this.x = x
    this.y = y
    this.value = value
  }

  insert(x: number, y: number, value: T): void {
    let current: LinkedList2<T> = this
    while (true) {
      if (current.x === x && current.y === y) {
        current.value = value
        return
      }
      if (current.next) {
        current = current.next
      } else {
        current.next = new LinkedList2(x, y, value)
        return
      }
    }
  }

  remove(x: number, y: number): boolean {
    let current: LinkedList2<T> = this
    while (current.next) {
      if (current.next.x === x && current.next.y === y) {
        current.next = current.next.next
        return true
      }
      current = current.next
    }
    return false
  }
}

type SingleEntry2<T> = { x: number, y: number, value: T }

/**
 * A hash grid that uses a hash function to map 2D coordinates (x, y) to a 32-bit 
 * integer map.
 * 
 * Hash grids are useful for spatial partitioning, for example in games or 
 * simulations, to run spatial algorithms like raycasting, pathfinding, random
 * sampling, etc.
 * 
 * A cell size can be specified to group values into cells. If the cell size is 0,
 * the hash function will use the exact coordinates, otherwise it will use the
 * coordinates divided by the cell size.
 * 
 * The hash function is very fast and has a very low collision rate.
 * 
 * Note: 
 * - Cell size can be omitted or set to 0 for exact coordinates, it's ok.
 * - The grid is memory-optimized and use linked lists only when there are more 
 *   than 1 value in the same cell.
 */
export class HashGrid2<T> {
  #map = new Map<number, SingleEntry2<T> | LinkedList2<T>>()
  #valueCount = 0
  #cellSize: number
  #hash: (x: number, y: number) => number

  get cellCount(): number {
    return this.#map.size
  }

  get valueCount(): number {
    return this.#valueCount
  }

  get cellSize(): number {
    return this.#cellSize
  }

  constructor(cellSize = 0) {
    this.#cellSize = cellSize
    this.#hash = (cellSize === 0)
      ? hash2
      : (x, y) => hash2(
        Math.floor(x / cellSize),
        Math.floor(y / cellSize))
  }

  clear(): void {
    this.#map.clear()
    this.#valueCount = 0
  }

  hasCell(x: number, y: number): boolean {
    return this.#map.has(this.#hash(x, y))
  }

  has(x: number, y: number): boolean {
    return this.get(x, y) !== undefined
  }

  get(x: number, y: number): T | undefined {
    const h = this.#hash(x, y)
    const e = this.#map.get(h)
    if (e === undefined) {
      return undefined
    }

    if (e instanceof LinkedList2) {
      let current: LinkedList2<T> | undefined = e
      while (current) {
        if (current.x === x && current.y === y)
          return current.value
        current = current.next
      }
      return undefined
    } else {
      return (e.x === x && e.y === y) ? e.value : undefined
    }
  }

  set(x: number, y: number, value: T | undefined): void {
    if (value === undefined) {
      this.delete(x, y)
      return
    }

    const h = this.#hash(x, y)
    const e = this.#map.get(h)

    if (e === undefined) {
      this.#map.set(h, { x, y, value })
      this.#valueCount++
    } else if (e instanceof LinkedList2) {
      e.insert(x, y, value)
      this.#valueCount++
    } else {
      if (e.x === x && e.y === y) {
        e.value = value
      } else {
        const list = new LinkedList2<T>(e.x, e.y, e.value)
        list.insert(x, y, value)
        this.#map.set(h, list)
        this.#valueCount++
      }
    }
  }

  delete(x: number, y: number): boolean {
    const h = this.#hash(x, y)
    const e = this.#map.get(h)

    if (e === undefined)
      return false

    if (e instanceof LinkedList2) {
      if (e.x === x && e.y === y) {
        if (e.next) {
          this.#map.set(h, e.next)
        } else {
          this.#map.delete(h)
        }
        this.#valueCount--
        return true
      } else {
        this.#valueCount--
        return e.remove(x, y)
      }
    } else {
      if (e.x === x && e.y === y) {
        this.#map.delete(h)
        this.#valueCount--
        return true
      }
      return false
    }
  }

  *cellValues(x: number, y: number): Generator<T, void, unknown> {
    const h = this.#hash(x, y)
    const e = this.#map.get(h)
    if (e === undefined) {
      return
    }

    if (e instanceof LinkedList2) {
      let current: LinkedList2<T> | undefined = e
      while (current) {
        yield current.value
        current = current.next
      }
    } else {
      yield e.value
    }
  }

  *values(): Generator<T, void, unknown> {
    for (const e of this.#map.values()) {
      if (e instanceof LinkedList2) {
        let current: LinkedList2<T> | undefined = e
        while (current) {
          yield current.value
          current = current.next
        }
      } else {
        yield e.value
      }
    }
  }

  *entries(): Generator<[x: number, y: number, value: T], void, unknown> {
    for (const e of this.#map.values()) {
      if (e instanceof LinkedList2) {
        let current: LinkedList2<T> | undefined = e
        while (current) {
          yield [current.x, current.y, current.value]
          current = current.next
        }
      } else {
        yield [e.x, e.y, e.value]
      }
    }
  }

  mapEntries<V>(fn: (x: number, y: number, value: T) => V): V[] {
    const values: V[] = []
    for (const e of this.#map.values()) {
      if (e instanceof LinkedList2) {
        let current: LinkedList2<T> | undefined = e
        while (current) {
          values.push(fn(current.x, current.y, current.value))
          current = current.next
        }
      } else {
        values.push(fn(e.x, e.y, e.value))
      }
    }
    return values
  }
}