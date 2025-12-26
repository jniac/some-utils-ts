class SuperEnumEntry<T> {
  constructor(
    public core: SuperEnumCore<T>,
    public name: string,
    public index: number,
    public value: T
  ) { }

  compare(other: any, { ignoreCase = true } = {}): boolean {
    if (other instanceof SuperEnumEntry) {
      return this.value === other.value
    }
    if (other instanceof RegExp) {
      return other.test(this.name)
    }
    if (typeof other === 'string' && ignoreCase) {
      return this.name.toLowerCase() === other.toLowerCase()
    }
    return this.value === other
  }

  next(): SuperEnumEntry<T>
  next(loop: true): SuperEnumEntry<T>
  next(loop: boolean): SuperEnumEntry<T> | null
  next(loop = true): any {
    const nextIndex = this.index + 1
    if (nextIndex >= this.core.entries.length) {
      if (loop)
        return this.core.entries[0]
      return null
    }
    return this.core.entries[nextIndex]
  }

  previous(): SuperEnumEntry<T>
  previous(loop: true): SuperEnumEntry<T>
  previous(loop: boolean): SuperEnumEntry<T> | null
  previous(loop = true): any {
    const prevIndex = this.index - 1
    if (prevIndex < 0) {
      if (loop)
        return this.core.entries[this.core.entries.length - 1]
      return null
    }
    return this.core.entries[prevIndex]
  }

  isFirst() {
    return this.index === 0
  }

  isLast() {
    return this.index === this.core.entries.length - 1
  }

  toString() {
    return `SuperEnumEntry(${this.name})`
  }
}

class SuperEnumCore<TValue> {
  entries = [] as SuperEnumEntry<TValue>[]

  constructor(entries: Record<string, TValue>) {
    this.entries = Object.entries(entries).map(([name, value], index) => new SuperEnumEntry(this, name, index, value))
  }

  parse(value: any, options?: Parameters<SuperEnumEntry<TValue>['compare']>[1]): SuperEnumEntry<TValue> | null {
    return this.entries.find(e => e.compare(value, options)) ?? null
  }

  parseOrThrow(value: any): SuperEnumEntry<TValue> {
    const entry = this.parse(value)
    if (!entry)
      throw new Error(`SuperEnum: Unable to parse value: ${value}`)
    return entry
  }

  entryByValue(value: TValue): SuperEnumEntry<TValue> | null
  entryByValue(value: TValue, defaultEntry: SuperEnumEntry<TValue>): SuperEnumEntry<TValue>
  entryByValue(value: TValue, defaultEntry?: SuperEnumEntry<TValue>): SuperEnumEntry<TValue> | null {
    return this.entries.find(e => e.value === value) ?? defaultEntry ?? null
  }

  next(value: SuperEnumEntry<TValue> | TValue, loop: true): SuperEnumEntry<TValue>
  next(value: SuperEnumEntry<TValue> | TValue, loop: false): SuperEnumEntry<TValue> | null
  next(value: SuperEnumEntry<TValue> | TValue, loop = true): any {
    const entry = value instanceof SuperEnumEntry
      ? value
      : this.entries.find(e => e.value === value)!
    return entry.next(loop)
  }

  previous(value: SuperEnumEntry<TValue> | TValue, loop: true): SuperEnumEntry<TValue>
  previous(value: SuperEnumEntry<TValue> | TValue, loop: false): SuperEnumEntry<TValue> | null
  previous(value: SuperEnumEntry<TValue> | TValue, loop = true): any {
    const entry = value instanceof SuperEnumEntry
      ? value
      : this.entries.find(e => e.value === value)!
    return entry.previous(loop)
  }
}

/**
 * SuperEnum is for easier enum management (eg: UI selections, cycling through values, etc).
 *
 * Example:
 * ```ts
 * const Colors = SuperEnum({
 *   Red: 0,
 *   Green: 1,
 *   Blue: 2,
 * })
 *
 * // Access entries by name
 * console.log(Colors.Red) // SuperEnumEntry { name: 'Red', value: 0, index: 0 }
 * console.log(Colors.Red.next()) // SuperEnumEntry { name: 'Green', value: 1, index: 1 }
 * ```
 */
export function superEnum<T extends Record<string, number | string>>(obj: T): SuperEnumCore<T[keyof T]> & Record<keyof T, SuperEnumEntry<T[keyof T]>> {
  const core = new SuperEnumCore(obj)
  return new Proxy(core, {
    get(target, prop, receiver) {
      if (prop in target)
        return Reflect.get(target, prop, receiver)
      const entry = target.entries.find(e => e.name === prop)
      if (entry)
        return entry
    }
  }) as any
}
