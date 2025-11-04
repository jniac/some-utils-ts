/**
 * Small wrapper around a Float64Array that allows to watch over numeral changes.
 */
export class Memorization {
  #array: Float64Array
  #index: number
  #sum: number
  derivative: Memorization | null = null

  get value(): number { return this.getValue() }
  get length(): number { return this.#array.length }
  get sum() { return this.#sum }
  get average() { return this.#sum / this.#array.length }

  constructor(length: number, initialValue: number, derivativeCount: number = 0) {
    this.#array = new Float64Array(length)
    this.#array.fill(initialValue)
    this.#sum = length * initialValue
    this.#index = 0
    if (derivativeCount > 0) {
      this.derivative = new Memorization(length, 0, derivativeCount - 1)
    }
  }

  reset(initialValue: number): this {
    const array = this.#array
    array.fill(initialValue)
    this.#sum = array.length * initialValue
    this.#index = 0
    if (this.derivative) {
      this.derivative.reset(0)
    }
    return this
  }

  getValue(): number {
    return this.#array[this.#index]
  }

  setValue(value: number, asNewValue: boolean): this {
    const array = this.#array
    const index = this.#index

    if (this.derivative) {
      const valueOld = array[index]
      const delta = value - valueOld
      this.derivative.setValue(delta, asNewValue)
    }

    const indexNew = asNewValue ? (index + 1 < array.length ? index + 1 : 0) : index
    this.#sum += value - array[indexNew]

    // At the end, update:
    array[indexNew] = value
    this.#index = indexNew

    return this
  }

  *values(): Generator<number, void, unknown> {
    const array = this.#array
    const index = this.#index
    const { length } = array
    for (let i = 0; i < length; i++) {
      const valueIndex = (index - i + length) % length
      yield array[valueIndex]
    }
  }

  valuesArray(out?: number[]): number[] {
    const array = this.#array
    const index = this.#index
    const { length } = array
    out ??= new Array(length)
    for (let i = 0; i < length; i++) {
      const valueIndex = (index - i + length) % length
      out[i] = array[valueIndex]
    }
    return out
  }

  valuesFloat64Array(out?: Float64Array): Float64Array {
    const array = this.#array
    const index = this.#index
    const { length } = array
    out ??= new Float64Array(length)
    for (let i = 0; i < length; i++) {
      const valueIndex = (index - i + length) % length
      out[i] = array[valueIndex]
    }
    return out
  }

  getAverage(count = this.#array.length): number {
    const array = this.#array
    const index = this.#index
    const { length } = array
    count = count > length
      ? length
      : count < 1
        ? 1
        : count
    let sum = 0
    for (let i = 0; i < count; i++) {
      const valueIndex = (index - i + length) % length
      sum += array[valueIndex]
    }
    return sum / count
  }

  signedMaximum(): number {
    const array = this.#array
    const { length } = array
    let max = 0, sign = 0
    for (let i = 0; i < length; i++) {
      const value = array[i]
      const absValue = Math.abs(value)
      if (absValue > max) {
        sign = value >= 0 ? 1 : -1
        max = absValue
      }
    }
    return max * sign
  }
}
