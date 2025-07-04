/**
 * Small wrapper around a Float64Array that allows to watch over numeral changes.
 */
export class Memorization {
  private _array: Float64Array
  private _index: number
  private _sum: number
  derivative: Memorization | null = null

  get value(): number { return this.getValue() }

  constructor(length: number, initialValue: number, derivativeCount: number = 0) {
    this._array = new Float64Array(length)
    this._array.fill(initialValue)
    this._sum = length * initialValue
    this._index = 0
    if (derivativeCount > 0) {
      this.derivative = new Memorization(length, 0, derivativeCount - 1)
    }
  }

  getValue(): number {
    const { _array, _index } = this
    return _array[_index]
  }

  setValue(value: number, asNewValue: boolean): this {
    const { _array, _index } = this

    if (this.derivative) {
      const valueOld = _array[_index]
      const delta = value - valueOld
      this.derivative.setValue(delta, asNewValue)
    }

    const indexNew = asNewValue ? (_index + 1 < _array.length ? _index + 1 : 0) : _index
    this._sum += value - _array[indexNew]

    // At the end, update:
    _array[indexNew] = value
    this._index = indexNew

    return this
  }

  *values(): Generator<number, void, unknown> {
    const { _array, _index } = this
    const { length } = _array
    for (let i = 0; i < length; i++) {
      const valueIndex = (_index - i + length) % length
      yield _array[valueIndex]
    }
  }

  valuesArray(): number[] {
    const { _array, _index } = this
    const { length } = _array
    const result: number[] = new Array(length)
    for (let i = 0; i < length; i++) {
      const valueIndex = (_index - i + length) % length
      result[i] = _array[valueIndex]
    }
    return result
  }

  getAverage(count = this._array.length): number {
    count = count > this._array.length
      ? this._array.length : count < 1
        ? 1 : count
    const { _array, _index } = this
    const { length } = _array
    let sum = 0
    for (let i = 0; i < count; i++) {
      const valueIndex = (_index - i + length) % length
      sum += _array[valueIndex]
    }
    return sum / count
  }

  get sum() { return this._sum }
  get average() { return this._sum / this._array.length }
}
