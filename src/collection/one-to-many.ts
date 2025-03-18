
export class OneToMany<K, V> {
  #keyToValues = new Map<K, Set<V>>();
  #valueToKeys?: Map<V, Set<K>>
  enableReverseMapping: boolean

  constructor(enableReverseMapping: boolean = false) {
    this.enableReverseMapping = enableReverseMapping
    if (enableReverseMapping) {
      this.#valueToKeys = new Map<V, Set<K>>()
    }
  }

  /**
   * Add a key-value pair.
   * Multiple values can be associated with the same key.
   */
  add(key: K, value: V): void {
    if (!this.#keyToValues.has(key)) {
      this.#keyToValues.set(key, new Set<V>())
    }
    this.#keyToValues.get(key)!.add(value)

    if (this.enableReverseMapping) {
      if (!this.#valueToKeys!.has(value)) {
        this.#valueToKeys!.set(value, new Set<K>())
      }
      this.#valueToKeys!.get(value)!.add(key)
    }
  }

  /**
   * Get all values associated with a key.
   */
  get(key: K): Set<V> | undefined {
    return this.#keyToValues.get(key)
  }

  /**
   * Get all keys associated with a value.
   */
  getKeys(value: V): Set<K> | undefined {
    if (this.enableReverseMapping) {
      return this.#valueToKeys!.get(value)
    } else {
      // Exhaustive search if reverse mapping is disabled
      const keys = new Set<K>()
      for (const [k, values] of this.#keyToValues.entries()) {
        if (values.has(value)) {
          keys.add(k)
        }
      }
      return keys.size > 0 ? keys : undefined
    }
  }

  /**
   * Remove a key and all its associated values.
   */
  delete(key: K): boolean {
    if (!this.#keyToValues.has(key)) {
      return false
    }

    const values = this.#keyToValues.get(key)!
    this.#keyToValues.delete(key)

    if (this.enableReverseMapping) {
      for (const value of values) {
        const keys = this.#valueToKeys!.get(value)
        if (keys) {
          keys.delete(key)
          if (keys.size === 0) {
            this.#valueToKeys!.delete(value)
          }
        }
      }
    }
    return true
  }

  /**
   * Remove a value from all associated keys.
   */
  deleteValue(value: V): boolean {
    if (this.enableReverseMapping) {
      const keys = this.#valueToKeys!.get(value)
      if (!keys) return false

      for (const key of keys) {
        const values = this.#keyToValues.get(key)
        if (values) {
          values.delete(value)
          if (values.size === 0) {
            this.#keyToValues.delete(key) // ✅ Remove key if its value set is empty
          }
        }
      }
      this.#valueToKeys!.delete(value)
      return true
    } else {
      // Exhaustive search
      let found = false
      for (const [key, values] of this.#keyToValues.entries()) {
        if (values.delete(value)) {
          found = true
          if (values.size === 0) {
            this.#keyToValues.delete(key) // ✅ Remove key if empty
          }
        }
      }
      return found
    }
  }

  /**
   * Check if a key exists.
   */
  has(key: K): boolean {
    return this.#keyToValues.has(key)
  }

  /**
   * Check if a value exists.
   */
  hasValue(value: V): boolean {
    if (this.enableReverseMapping) {
      return this.#valueToKeys!.has(value)
    } else {
      for (const values of this.#keyToValues.values()) {
        if (values.has(value)) return true
      }
      return false
    }
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.#keyToValues.clear()
    if (this.enableReverseMapping) {
      this.#valueToKeys!.clear()
    }
  }

  /**
   * Get the count of unique keys.
   */
  keyCount(): number {
    return this.#keyToValues.size
  }

  /**
   * Get the count of unique values.
   */
  valueCount(): number {
    if (this.enableReverseMapping) {
      return this.#valueToKeys!.size
    } else {
      const uniqueValues = new Set<V>()
      for (const values of this.#keyToValues.values()) {
        for (const value of values) {
          uniqueValues.add(value)
        }
      }
      return uniqueValues.size
    }
  }
}