
/**
 * Base class for creating enums with convenient methods (previous, next, parse).
 * 
 * Usage:
 * ```typescript
 * class Color extends Enum {
 *   static values: Color[] = []
 *   static parse = (value: any) => Enum._parse(Color.values, value)
 * 
 *   static Red = new Color(this, 'red')
 *   static Green = new Color(this, 'green')
 *   static Blue = new Color(this, 'blue')
 * }
 * 
 * console.log(Color.parse('red')) // Color { name: 'red', index: 0, uid: 0 }
 * console.log(Color.parse(1)) // Color { name: 'green', index: 1, uid: 1 }
 * console.log(Color.parse(Color.Blue)) // Color { name: 'blue', index: 2, uid: 2 }
 * console.log(Color.Blue.next()) // Color { name: 'red', index: 0, uid: 0 }
 * ```
 */
export class Enum {
  static #nextUid = 0

  protected static _parse<T extends Enum>(values: T[], value: any): T | null {
    if (typeof value === 'string') {
      return values.find(v => v.name === value) || null
    } else if (typeof value === 'number') {
      return values.find(v => v.index === value) || null
    } else if (value instanceof Enum) {
      return values.find(v => v.uid === value.uid) || null
    }
    return null
  }

  readonly uid = Enum.#nextUid++
  readonly name: string
  readonly index: number
  readonly enumClass: { values: Enum[] }

  constructor(enumClass: { values: Enum[] }, name: string) {
    this.name = name
    this.enumClass = enumClass
    this.index = enumClass.values.length
    enumClass.values.push(this)
  }

  previous(): this {
    const previousIndex = (this.index - 1 + this.enumClass.values.length) % this.enumClass.values.length
    return this.enumClass.values[previousIndex] as this
  }

  next(): this {
    const nextIndex = (this.index + 1) % this.enumClass.values.length
    return this.enumClass.values[nextIndex] as this
  }
}