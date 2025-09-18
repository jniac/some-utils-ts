
/**
 * A map that associates keys with arrays of values, ensuring that each value
 * is unique across all keys. If a value is added to a new key, it is removed
 * from any previous key it was associated with.
 * 
 * Could be also as an "tagged value set" where each value can have a single tag (key),
 * but each tag can have multiple values.
 */
export class UniqueValueMap<K, V> {
  #keyToValues = new Map<K, V[]>();
  #valueToKey = new Map<V, K>();

  /**
   * Associates a value with a key. If the value was previously associated 
   * with a different key, it will be removed from that key first.
   */
  set(key: K, value: V): void {
    // If value already exists with a different key, remove it
    const existingKey = this.#valueToKey.get(value)
    if (existingKey !== undefined && existingKey !== key) {
      this.#removeValueFromKey(existingKey, value)
    }

    // Add value to the new key
    if (!this.#keyToValues.has(key)) {
      this.#keyToValues.set(key, [])
    }

    // Only add if not already present for this key
    const values = this.#keyToValues.get(key)!
    if (!values.includes(value)) {
      values.push(value)
    }

    this.#valueToKey.set(value, key)
  }

  /**
   * Returns the key associated with a value, or undefined if not found.
   */
  getKey(value: V): K | undefined {
    return this.#valueToKey.get(value)
  }

  /**
   * Deletes a value from the collection entirely.
   * Returns true if the value was found and removed.
   */
  delete(value: V): boolean {
    const key = this.#valueToKey.get(value)
    if (key === undefined) {
      return false
    }

    this.#removeValueFromKey(key, value)
    this.#valueToKey.delete(value)
    return true
  }

  /**
   * Deletes all values associated with a key.
   * Returns the number of items removed.
   */
  deleteAll(key: K): number {
    const values = this.#keyToValues.get(key)
    if (!values) {
      return 0
    }

    const count = values.length

    // Remove all values from the value-to-key mapping
    for (const value of values) {
      this.#valueToKey.delete(value)
    }

    // Remove the key entirely
    this.#keyToValues.delete(key)

    return count
  }

  hasValue(value: V): boolean {
    return this.#valueToKey.has(value)
  }

  /**
   * Returns the value at a specific index for a key, or undefined if not found.
   * Negative indices count from the end (-1 is last element).
   */
  valueAt(key: K, index: number): V | undefined {
    const values = this.#keyToValues.get(key)
    if (!values) {
      return undefined
    }

    // Handle negative indices
    if (index < 0) {
      index = values.length + index
    }

    return values[index]
  }

  *valuesOf(key: K): Generator<V> {
    const values = this.#keyToValues.get(key)
    if (values) {
      for (const value of values) {
        yield value
      }
    }
  }

  *allValues(): Generator<V> {
    for (const values of this.#keyToValues.values()) {
      for (const value of values) {
        yield value
      }
    }
  }

  /**
   * Generator that yields [index, value] pairs for a specific key.
   */
  *entriesOf(key: K): Generator<[index: number, value: V]> {
    const values = this.#keyToValues.get(key)
    if (values) {
      for (let i = 0; i < values.length; i++) {
        yield [i, values[i]]
      }
    }
  }

  /**
   * Generator that yields [key, index, value] tuples for all entries.
   */
  *allEntries(): Generator<[key: K, index: number, value: V]> {
    for (const [key, values] of this.#keyToValues) {
      for (let i = 0; i < values.length; i++) {
        yield [key, i, values[i]]
      }
    }
  }

  /**
   * Returns the number of values associated with a key.
   */
  sizeOf(key: K): number {
    const values = this.#keyToValues.get(key)
    return values ? values.length : 0
  }

  /**
   * Returns the index of a value within the array for a specific key.
   * Returns -1 if the value is not found for that key.
   */
  indexOf(key: K, value: V): number {
    const values = this.#keyToValues.get(key)
    return values ? values.indexOf(value) : -1
  }

  /**
   * Moves a value from one index to another within the array for a specific key.
   * Negative indices count from the end (-1 is last element).
   * Returns true if the value was moved, false if it was not found or no move occurred.
   */
  moveTo(key: K, value: V, toIndex: number): boolean {
    const values = this.#keyToValues.get(key)
    if (!values) {
      return false
    }
    const count = values.length
    if (count === 0) {
      return false
    }

    const fromIndex = values.indexOf(value)
    if (fromIndex === -1) {
      return false
    }

    // Handle negative indices
    if (toIndex < 0) {
      toIndex = count + toIndex
    }

    // Clamp to valid range
    toIndex = Math.min(Math.max(toIndex, 0), count - 1)
    if (toIndex === fromIndex) {
      return false
    }

    // Swap the values
    const temp = values[fromIndex]
    values[fromIndex] = values[toIndex]
    values[toIndex] = temp

    return true
  }

  /**
   * Moves a value within the array for a specific key by a given delta.
   * Positive delta moves the value forward, negative delta moves it backward.
   * Returns true if the value was moved, false if it was not found or no move occurred.
   */
  moveBy(key: K, value: V, delta: number): boolean {
    const values = this.#keyToValues.get(key)
    if (!values) {
      return false
    }

    const index = values.indexOf(value)
    if (index === -1) {
      return false
    }

    const newIndex = Math.min(Math.max(index + delta, 0), values.length - 1)
    if (newIndex === index) {
      return false
    }

    // Swap the values
    const temp = values[index]
    values[index] = values[newIndex]
    values[newIndex] = temp

    return true
  }

  sort(key: K, compareFn: (a: V, b: V) => number): void {
    const values = this.#keyToValues.get(key)
    if (values && values.length > 1) {
      values.sort(compareFn)
    }
  }

  /**
   * Removes all entries from the collection.
   */
  clear(): void {
    this.#keyToValues.clear()
    this.#valueToKey.clear()
  }

  /**
   * Helper method to remove a specific value from a specific key.
   */
  #removeValueFromKey(key: K, value: V): void {
    const values = this.#keyToValues.get(key)
    if (values) {
      const index = values.indexOf(value)
      if (index !== -1) {
        values.splice(index, 1)
        // If no values left for this key, remove the key
        if (values.length === 0) {
          this.#keyToValues.delete(key)
        }
      }
    }
  }
}
