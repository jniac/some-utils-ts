
const shiftLeft = (x: number) => {
  return ((x | 0) < 0
    ? ((x & 0b01111111111111111111111111111111) << 1) | 1
    : x << 1)
}

// const shiftRight = (x: number) => {
//   return ((x | 0) < 0
//     ? ((x & 1) ? 0b10000000000000000000000000000000 : 0) | ((x & 0b01111111111111111111111111111111) >> 1) | 0b01000000000000000000000000000000
//     : ((x & 1) ? 0b10000000000000000000000000000000 : 0) | (x >> 1))
// }

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
      _i32[0] = shiftLeft(_i32[0]) ^ _i32[2]
      _i32[1] = shiftLeft(_i32[1]) ^ _i32[3]
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
        _i32[0] = shiftLeft(_i32[0]) ^ _i32[2]
        _i32[1] = shiftLeft(_i32[1]) ^ _i32[3]
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
        _i32[0] = shiftLeft(_i32[0]) ^ _i32[2]
        _i32[1] = shiftLeft(_i32[1]) ^ _i32[3]
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