import { Hash } from '../hash'

type Primitive = boolean | number | bigint | string | symbol

function isPrimitive(value: any): value is Primitive {
  if (value === null || value === undefined) {
    return true
  }
  switch (typeof value) {
    case 'function':
    case 'object': {
      return false
    }
    default: {
      return true
    }
  }
}

/**
 * Returns a unique id (session based) for any given values, which could be:
 * - primitives
 * - (non-array) objects
 * - a combination of the two (array)
 * 
 * ```
 * const idRegister = new IdRegister()
 * const obj = { foo: 'bar' }
 * idRegister.requireId([1, 'A', obj]) === idRegister.requireId([1, 'A', obj]) // true
 * ```
 * 
 * - NOTE: This is not a hash function, it is a unique id generator.
 * - NOTE: Objects are stored weakly, so they will not be retained in memory.
 */
export class HashRegister {
  static *iterateTargetItems(value: any[]): Generator<any> {
    if (!Array.isArray(value)) {
      yield value
      return
    }
    for (const item of value) {
      if (Array.isArray(item)) {
        yield* HashRegister.iterateTargetItems(item)
      } else {
        yield item
      }
    }
  }

  /**
   * Check if two "target" values are the same.
   * 
   * Reminder:
   * - Target values can be:
   *   - primitives
   *   - (non-array) objects
   *   - a combination of the two (array)
   */
  static areSame(valueA: any, valueB: any): boolean {
    const aIterator = HashRegister.iterateTargetItems(valueA)
    const bIterator = HashRegister.iterateTargetItems(valueB)
    while (true) {
      const aResult = aIterator.next()
      const bResult = bIterator.next()
      if (aResult.done && bResult.done) {
        return true
      }
      if (aResult.done || bResult.done) {
        return false
      }
      if (aResult.value !== bResult.value) {
        return false
      }
    }
  }

  static #idHash = new Hash()
  static #arrayHash = new Hash()

  #count = 1
  #map = new Map<Primitive, number>()
  #weakMap = new WeakMap<object, number>()

  #getHash(): number {
    return HashRegister.#idHash.init().update(++this.#count).getValueAsInt32()
  }

  #registerObject(value: object): number {
    const id = this.#getHash()
    this.#weakMap.set(value, id)
    return id
  }

  #registerPrimitive(value: Primitive): number {
    const id = this.#getHash()
    this.#map.set(value, id)
    return id
  }

  #requirePrimitiveHash(value: Primitive) {
    return this.#map.get(value) ?? this.#registerPrimitive(value)
  }

  #requireObjectHash(value: object) {
    return this.#weakMap.get(value) ?? this.#registerObject(value)
  }

  /**
   * Note:
   * - Thanks to `#requireArrayId_iterate`, nested arrays are flattened.
   * - This ensures that every item in the array is NOT an array, so we can use
   *   one single level of hashing.
   * - `[1, [2, 3]]` and `[1, 2, 3]` yield the same id.
   */
  #requireArrayHash(value: any[]) {
    const hash = HashRegister.#arrayHash
    hash.init()
    for (const item of HashRegister.iterateTargetItems(value)) {
      hash.update(this.requireHash(item))
    }
    return hash.getValueAsInt32()
  }

  /**
   * Creates or retrieves a unique hash for the given value.
   * 
   * Notes:
   * - ⚠️ Hashes are not based on content. They are unique ids based on order of registration.
   * - ⚠️ Arrays are flattened, so nested arrays are not differentiated.
   * - Hashes are session based, they are not persistent.
   * - Objects are stored weakly, so they will not be retained in memory.
   */
  requireHash(value: any): number {
    return (isPrimitive(value)
      ? this.#requirePrimitiveHash(value)
      : Array.isArray(value)
        ? this.#requireArrayHash(value)
        : this.#requireObjectHash(value))
  }
}
