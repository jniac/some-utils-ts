export class OrderedSet<T> {
  #items: T[] = [];
  #itemSet = new Set<T>();

  /**
   * Adds an item to the set. If the item already exists, returns false.
   * Otherwise adds it to the end and returns true.
   */
  add(item: T): boolean {
    if (this.#itemSet.has(item)) {
      return false
    }
    this.#items.push(item)
    this.#itemSet.add(item)
    return true
  }

  /**
   * Removes an item from the set.
   * Returns true if the item was found and removed.
   */
  remove(item: T): boolean {
    if (!this.#itemSet.has(item)) {
      return false
    }
    const index = this.#items.indexOf(item)
    this.#items.splice(index, 1)
    this.#itemSet.delete(item)
    return true
  }

  /**
   * Checks if an item exists in the set.
   */
  has(item: T): boolean {
    return this.#itemSet.has(item)
  }

  /**
   * Returns the index of an item, or -1 if not found.
   */
  indexOf(item: T): number {
    return this.#items.indexOf(item)
  }

  /**
   * Returns the item at the specified index, or undefined if out of bounds.
   */
  at(index: number): T | undefined {
    return this.#items[index]
  }

  /**
   * Returns the number of items in the set.
   */
  get size(): number {
    return this.#items.length
  }

  /**
   * Moves an item by the specified delta within the set.
   * Returns the new index, or -1 if the item wasn't found.
   */
  moveBy(item: T, delta: number): number {
    const currentIndex = this.indexOf(item)
    if (currentIndex === -1) {
      return -1
    }

    const newIndex = Math.max(0, Math.min(this.#items.length - 1, currentIndex + delta))
    return this.#moveToIndex(currentIndex, newIndex)
  }

  /**
   * Moves an item to the specified index within the set.
   * Negative indices count from the end (-1 is last element).
   * Returns the actual new index, or -1 if the item wasn't found.
   */
  moveTo(item: T, newIndex: number): number {
    const currentIndex = this.indexOf(item)
    if (currentIndex === -1) {
      return -1
    }

    if (newIndex < 0) {
      newIndex = this.#items.length + newIndex
    }

    const clampedIndex = Math.max(0, Math.min(this.#items.length - 1, newIndex))
    return this.#moveToIndex(currentIndex, clampedIndex)
  }

  /**
   * Sorts the set using the provided comparison function or natural ordering.
   */
  sort(compareFn?: (a: T, b: T) => number): this {
    this.#items.sort(compareFn)
    return this
  }

  /**
   * Clears all items from the set.
   */
  clear(): void {
    this.#items.length = 0
    this.#itemSet.clear()
  }

  /**
   * Returns an iterator over the items in order.
   */
  *[Symbol.iterator](): Iterator<T> {
    for (const item of this.#items) {
      yield item
    }
  }

  /**
   * Returns an iterator over [index, item] pairs.
   */
  *entries(): Iterator<[number, T]> {
    for (let i = 0; i < this.#items.length; i++) {
      yield [i, this.#items[i]]
    }
  }

  /**
   * Returns a copy of the internal array.
   */
  toArray(): T[] {
    return [...this.#items]
  }

  /**
   * Helper method to move an item from one index to another.
   */
  #moveToIndex(fromIndex: number, toIndex: number): number {
    if (fromIndex === toIndex) {
      return toIndex
    }

    const item = this.#items[fromIndex]
    this.#items.splice(fromIndex, 1)
    this.#items.splice(toIndex, 0, item)
    return toIndex
  }
}
