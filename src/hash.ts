
const circularShiftLeft = (x: number) => {
  return (x << 1) | (x >>> 31)
}

/**
 * Hashing numbers through simple bitwise operations using ArrayBuffer.
 * 
 * Properties:
 * - Hashes numbers as Float64
 * - `getValueAsInt32()` returns , so for one given float there is one chance over 
 *   4_294_967_296 to collide with another float.
 * 
 * How does it works?
 * - An 16-bytes-length ArrayBuffer is created for each new instance. That small
 *   buffer represents the internal state.
 * - The ArrayBuffer is used to convert 1 Float64 to 2 Int32 without data loss.
 * - Bitwise operations are applied over Int32 values (shift and xor)
 */
export class Hash {
  private static _instance = new Hash()

  static init(): typeof Hash {
    Hash._instance.init()
    return Hash
  }

  static update(value: number): typeof Hash {
    Hash._instance.update(value)
    return Hash
  }

  static updateNumbers(numbers: ArrayLike<number>): typeof Hash {
    Hash._instance.updateNumbers(numbers)
    return Hash
  }

  static updateString(str: string): typeof Hash {
    Hash._instance.updateString(str)
    return Hash
  }

  static getValue(): number {
    return Hash._instance.getValue()
  }

  static getValueAsInt32(): number {
    return Hash._instance.getValueAsInt32()
  }

  static getDebugString(): string {
    return Hash._instance.getDebugString()
  }

  static get value() {
    return Hash._instance.value
  }

  static compute(...args: any[]): number {
    return Hash._instance.compute(...args)
  }

  private _buffer = new ArrayBuffer(16)
  private _f64 = new Float64Array(this._buffer)
  private _i32 = new Int32Array(this._buffer)

  constructor() {
    this.init()
  }

  init(): this {
    this._i32[0] = 0b11011110101000001010000101011111
    this._i32[1] = 0b00101101111011111101111000101000
    return this
  }

  update: (value: number) => Hash = (() => {
    // Direct access to buffers (without "this") performs 40% faster.
    const { _i32, _f64 } = this
    return value => {
      _f64[1] = value
      _i32[0] = circularShiftLeft(_i32[0]) ^ _i32[2]
      _i32[1] = circularShiftLeft(_i32[1]) ^ _i32[3]
      return this
    }
  })()

  updateNumbers: (numbers: ArrayLike<number>) => Hash = (() => {
    // Direct access to buffers (without "this") performs 40% faster.
    const { _i32, _f64 } = this
    return numbers => {
      const max = numbers.length
      for (let i = 0; i < max; i++) {
        _f64[1] = numbers[i]
        _i32[0] = circularShiftLeft(_i32[0]) ^ _i32[2]
        _i32[1] = circularShiftLeft(_i32[1]) ^ _i32[3]
      }
      return this
    }
  })()

  updateString: (str: string) => Hash = (() => {
    // Direct access to buffers (without "this") performs 40% faster.
    const { _i32, _f64 } = this
    return str => {
      str = String(str) // Force cast.
      const max = str.length
      for (let i = 0; i < max; i++) {
        _f64[1] = str.charCodeAt(i)
        _i32[0] = circularShiftLeft(_i32[0]) ^ _i32[2]
        _i32[1] = circularShiftLeft(_i32[1]) ^ _i32[3]
      }
      return this
    }
  })()

  getValue(): number {
    return this._f64[0]
  }

  getValueAsInt32(): number {
    return this._i32[0] ^ this._i32[1]
  }

  getValueAsBigUint64(): BigInt {
    return new BigUint64Array(this._buffer)[0]
  }

  get value(): number {
    return this.getValue()
  }

  /**
   * Computes a hash from any number of arguments of any type.
   * 
   * Supported types:
   * - `null` and `undefined`
   * - `boolean`
   * - `number`
   * - `string`
   * - `function` (uses function name and length)
   * - `object` (recursively explores objects and arrays)
   * 
   * Special handling for objects:
   * - If an object has a `value` key, only that key is considered for hashing.
   * - If an object has an `id` or `uuid` key, only that key is considered for hashing.
   * 
   * Note: 
   * - Circular references are not handled and will cause an infinite loop.
   * 
   * @param args - The arguments to hash.
   * @returns A hash number representing the combined input arguments.
   */
  compute(...args: any[]): number {
    this.init()
    const queue: any[] = [...args]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === null || current === undefined) {
        this.update(123456)
        continue
      }
      const type = typeof current
      switch (type) {
        case 'boolean': {
          this.update(37842398 + (current ? 0 : 1))
          break
        }
        case 'function': {
          this.updateString((current as Function).name)
          this.update((current as Function).length)
          break
        }
        case 'string': {
          this.updateString(current)
          break
        }
        case 'number': {
          this.update(current)
          break
        }
        case 'object': {
          // If object has "value" key, object is a wrapper, "value" is important, ignore everything else.
          if ('value' in current) {
            queue.push(current.value)
            break
          }
          // If object has id, the id is enough to deduce identity, ignore everything else.
          if ('uuid' in current) {
            this.updateString(current.uuid)
            break
          }
          if ('id' in current) {
            this.updateString(String(current.id))
            break
          }

          if (Array.isArray(current)) {
            queue.push(...current)
          } else {
            for (const [key, value] of Object.entries(current)) {
              this.updateString(key)
              queue.push(value)
            }
          }
          break
        }
      }
    }
    return this.getValue()
  }

  getDebugString(): string {
    const to0b = (x: number) => {
      x = x | 0
      const sign = x < 0
      x = x & 0b01111111111111111111111111111111
      return `${(sign ? '1' : '0')}${x.toString(2).padStart(31, '0')}`
    }
    const [a, b, c, d] = [...this._i32].map(to0b)
    return [
      'value:',
      this.getValue(),
      'state:', a, b,
      'last "next" value:', c, d,
    ].join('\n')
  }
}