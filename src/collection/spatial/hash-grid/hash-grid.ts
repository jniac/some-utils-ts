import { hash2 } from './hash'

type Entry2<T> = [x: number, y: number, value: T]

type SingleEntry2<T> = { x: number, y: number, value: T }

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

function* yieldSingleEntryOrLinkedList2<T>(e?: SingleEntry2<T> | LinkedList2<T>): Generator<Entry2<T>, void, unknown> {
  if (e === undefined)
    return
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
  // @ts-ignore
  #cellHash: (x: number, y: number) => number

  constructor(cellSize = 0) {
    this.#cellSize = cellSize
    this.#cellHash = (cellSize === 0)
      ? hash2
      : (x, y) => hash2(
        Math.floor(x / cellSize),
        Math.floor(y / cellSize))
    // @ts-ignore

    // Hack for memo:
    // raw string hash function has quite the same performance as the number hash 
    // function, which is a little deceiving since the number hash function was 
    // not that easy to implement with a low rate collision, but hey, at least
    // `hash2` is a good hash function, compatible with other more-lower-level 
    // languages.
    // this.#hash = (cellSize === 0)
    //   ? (x: number, y: number) => `${x},${y}`
    //   : (x: number, y: number) => {
    //     x = Math.floor(x / this.#cellSize)
    //     y = Math.floor(y / this.#cellSize)
    //     return `${x},${y}`
    //   }
  }

  clear(): void {
    this.#map.clear()
    this.#valueCount = 0
  }

  hasCell(x: number, y: number): boolean {
    return this.#map.has(this.#cellHash(x, y))
  }

  has(x: number, y: number): boolean {
    return this.get(x, y) !== undefined
  }

  get(x: number, y: number): T | undefined {
    const h = this.#cellHash(x, y)
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
      return (e.x === x && e.y === y)
        ? e.value
        : undefined
    }
  }

  set(x: number, y: number, value: T | undefined): void {
    if (value === undefined) {
      this.delete(x, y)
      return
    }

    const h = this.#cellHash(x, y)
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
    const h = this.#cellHash(x, y)
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

  /**
   * Returns a generator of all values in the cell at (x, y).
   */
  *cellEntries(x: number, y: number): Generator<Entry2<T>, void, unknown> {
    const e = this.#map.get(this.#cellHash(x, y))
    yield* yieldSingleEntryOrLinkedList2(e)
  }

  cellFirstEntry(x: number, y: number): Entry2<T> | undefined {
    const e = this.#map.get(this.#cellHash(x, y))
    return e && [e.x, e.y, e.value]
  }

  *cellNeighborEntries(x: number, y: number, neighborExtent = 1): Generator<Entry2<T>, void, unknown> {
    const map = this.#map
    const hash = this.#cellHash
    const cellSize = this.#cellSize
    for (let i = -neighborExtent; i <= neighborExtent; i++) {
      for (let j = -neighborExtent; j <= neighborExtent; j++) {
        const cx = x + i * cellSize
        const cy = y + j * cellSize
        const e = map.get(hash(cx, cy))
        yield* yieldSingleEntryOrLinkedList2(e)
      }
    }
  }

  *entries(): Generator<Entry2<T>, void, unknown> {
    for (const e of this.#map.values())
      yield* yieldSingleEntryOrLinkedList2(e)
  }

  *cellValues(x: number, y: number): Generator<T, void, unknown> {
    for (const [, , value] of this.cellEntries(x, y))
      yield value
  }

  *values(): Generator<T, void, unknown> {
    for (const [, , value] of this.entries())
      yield value
  }

  mapEntries<V>(fn: (x: number, y: number, value: T) => V): V[] {
    const values: V[] = []
    for (const [x, y, value] of this.entries())
      values.push(fn(x, y, value))
    return values
  }

  /**
   * Returns a generator of all the entries in the grid that are within a circle of
   * radius `radius` centered at (x, y).
   */
  *query(x: number, y: number, radius: number): Generator<Entry2<T>, void, unknown> {
    const radius2 = radius * radius
    for (const [px, py, value] of this.cellNeighborEntries(x, y, Math.ceil(radius / this.#cellSize))) {
      const dx = px - x
      const dy = py - y
      if (dx * dx + dy * dy <= radius2)
        yield [px, py, value]
    }
  }

  /**
   * Returns the first entry in the grid that is within a circle of radius
   * `radius` centered at (x, y).
   * 
   * Note: The first entry is not necessarily the closest one.
   */
  queryFirst(x: number, y: number, radius: number): Entry2<T> | undefined {
    for (const [px, py, value] of this.query(x, y, radius)) {
      return [px, py, value]
    }
    return undefined
  }

  /**
   * Returns the closest entry in the grid that is within a circle of radius
   * `radius` centered at (x, y).
   */
  queryNearest(x: number, y: number, radius: number): Entry2<T> | undefined {
    let nearest: Entry2<T> | undefined
    let nearestDistance = Infinity
    for (const [px, py, value] of this.query(x, y, radius)) {
      const dx = px - x
      const dy = py - y
      const distance = dx * dx + dy * dy
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = [px, py, value]
      }
    }
    return nearest
  }

  // Readonly properties & Utils

  get cellCount(): number {
    return this.#map.size
  }

  get valueCount(): number {
    return this.#valueCount
  }

  get cellSize(): number {
    return this.#cellSize
  }

  /**
   * The same hash function that is used to store the values in the grid (based
   * on the cell size).
   */
  get cellHash(): (x: number, y: number) => number {
    return this.#cellHash
  }

  floor(x: number) {
    return Math.floor(x / this.#cellSize) * this.#cellSize
  }

  ceil(x: number) {
    return Math.ceil(x / this.#cellSize) * this.#cellSize
  }

  round(x: number) {
    return Math.round(x / this.#cellSize) * this.#cellSize
  }

  computeMaxValueCountPerCell(): number {
    let max = 0
    for (const e of this.#map.values()) {
      if (e instanceof LinkedList2) {
        let count = 0
        let current: LinkedList2<T> | undefined = e
        while (current) {
          count++
          current = current.next
        }
        if (count > max)
          max = count
      } else {
        max = Math.max(max, 1)
      }
    }
    return max
  }
}