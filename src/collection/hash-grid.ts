
const PRIME1 = 48271
const PRIME2 = 2246822519
const PRIME3 = 3266489917
const PRIME4 = 668265263

function mix(x: number, shift = 2, factor = 6329): number {
  x = Math.imul(x, factor)
  return (x << shift) | (x >>> (32 - shift))
}

const f64 = new Float64Array(1)
const i32 = new Int32Array(f64.buffer)

/**
 * An hash function that takes two numbers (x, y) and returns a 32-bit integer.
 * 
 * Collision rate is very, very low:
 * 
 * Here are the results of tests with 16_000_000 random & sequential pairs of numbers:
 * - random pairs: collision ratio: 0.19% (one collision every 5000 pairs)
 * - sequential pairs: collision ratio: 0.02% (one collision every 50_000 pairs)
 * ```
 * {
 *   method: 'hash2:random',
 *   elapsed: 0.27758300000004965,
 *   hashPerMillisecond: 36025,
 *   collisionCount: 29896,
 *   totalCount: 16000000,
 *   collisionRatio: 0.0018685,
 *   maxCollisionForHash: 2
 * }
 * {
 *   method: 'hash2:sequential',
 *   elapsed: 0.29354199999943376,
 *   hashPerMillisecond: 34066,
 *   collisionCount: 3248,
 *   totalCount: 16000000,
 *   collisionRatio: 0.000203,
 *   maxCollisionForHash: 1
 * }
 *  ```
 */
export function hash2(x: number, y: number): number {
  f64[0] = x
  const x1 = i32[0]
  const x2 = i32[1]

  f64[0] = y
  const y1 = i32[0]
  const y2 = i32[1]

  return (
    mix(x1, 3, PRIME1) ^
    mix(y1, 17, PRIME2)) ^ (
      mix(x2, 13, PRIME3) ^
      mix(y2, 27, PRIME4))
}

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

type HashEntry<T> = { x: number, y: number, value: T }

/**
 * A hash grid that uses a hash function to map 2D coordinates (x, y) to a 32-bit 
 * integer map.
 * 
 * It uses internally a linked list to handle collisions.
 * 
 * The hash function is very fast and has a very low collision rate.
 * 
 * Hash grids are useful for spatial partitioning, for example in games or 
 * simulations, to run spatial algorithms like raycasting, pathfinding, random
 * sampling, etc.
 */
export class HashGrid2<T> {
  #map = new Map<number, HashEntry<T> | LinkedList2<T>>()
  #size = 0

  get mapSize(): number {
    return this.#map.size
  }

  get size(): number {
    return this.#size
  }

  clear(): void {
    this.#map.clear()
    this.#size = 0
  }

  has(x: number, y: number): boolean {
    const h = hash2(x, y)
    return this.#map.has(h)
  }

  get(x: number, y: number): T | undefined {
    const h = hash2(x, y)
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

    const h = hash2(x, y)
    const e = this.#map.get(h)

    if (e === undefined) {
      this.#map.set(h, { x, y, value })
      this.#size++
    } else if (e instanceof LinkedList2) {
      e.insert(x, y, value)
      this.#size++
    } else {
      if (e.x === x && e.y === y) {
        e.value = value
      } else {
        const list = new LinkedList2<T>(e.x, e.y, e.value)
        list.insert(x, y, value)
        this.#map.set(h, list)
        this.#size++
      }
    }
  }

  delete(x: number, y: number): boolean {
    const h = hash2(x, y)
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
        this.#size--
        return true
      } else {
        this.#size--
        return e.remove(x, y)
      }
    } else {
      if (e.x === x && e.y === y) {
        this.#map.delete(h)
        this.#size--
        return true
      }
      return false
    }
  }
}