import { calculateExponentialDecay } from '../math/misc/exponential-decay'
import { DestroyableObject } from '../types'
import { Memorization } from './memorization'
import { Callback, ConstructorOptions, Observable, OnChangeOptions, SetValueOptions } from './observable'

const passModeValues = ['above', 'below', 'through'] as const
type PassMode = (typeof passModeValues)[number]

type ConstructorNumberOptions = ConstructorOptions<number> & Partial<{
  upperBound: number
  lowerBound: number
  integer: boolean
}>

function clamp(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x
}

export class ObservableNumber extends Observable<number> {
  private _memorization: Memorization | null = null
  private _lowerBound: number
  private _upperBound: number
  private _integer: boolean

  get lowerBound(): number {
    return this._lowerBound
  }

  set lowerBound(value: number) {
    this.setBounds(value, this._upperBound)
  }

  get upperBound(): number {
    return this._upperBound
  }

  set upperBound(value: number) {
    this.setBounds(this._lowerBound, value)
  }

  /**
   * @deprecated Use `lowerBound` instead.
   */
  get min() { return this.lowerBound }

  /**
   * @deprecated Use `lowerBound` instead.
   */
  set min(value: number) { this.lowerBound = value }

  /**
   * @deprecated Use `upperBound` instead.
   */
  get max() { return this.upperBound }

  /**
   * @deprecated Use `upperBound` instead.
   */
  set max(value: number) { this.upperBound = value }

  get delta(): number {
    return this._value - this._valueOld
  }

  constructor(initialValue: number, options?: [lowerBound: number, upperBound: number] | ConstructorNumberOptions) {
    let lowerBound = -Infinity, upperBound = Infinity

    if (Array.isArray(options)) {
      [lowerBound, upperBound] = options
      options = {} as ConstructorOptions<number>
    } else {
      lowerBound = options?.lowerBound ?? lowerBound
      upperBound = options?.upperBound ?? upperBound
    }

    super(clamp(initialValue, lowerBound, upperBound), options)

    this._lowerBound = lowerBound
    this._upperBound = upperBound
    this._integer = options?.integer ?? false
  }

  override setValue(incomingValue: number, options?: SetValueOptions): boolean {
    // Before anything, clamp the incoming value:
    incomingValue = clamp(incomingValue, this._lowerBound, this._upperBound)
    incomingValue = this._integer ? Math.round(incomingValue) : incomingValue

    // Delay special case:
    if (this._handleDelay(incomingValue, options)) {
      return false
    }

    // No-delay, regular case:
    const hasChanged = super.setValue(incomingValue, options)
    if (this._memorization) {
      // NOTE: `hasChanged` is ignored with memorization (which may record "zero" changes).
      this._memorization.setValue(this._value, true)
    }
    return hasChanged
  }

  /**
   * Returns true if the value has changed (because of the new bounds).
   */
  setBounds(min: number, max: number): boolean {
    const newValue = clamp(this._value, min, max)
    this._lowerBound = min
    this._upperBound = max
    if (this._value !== newValue) {
      return this.setValue(newValue)
    }
    return false
  }

  /**
   * @deprecated Use `setBounds` instead.
   */
  setMinMax(...args: Parameters<ObservableNumber['setBounds']>) {
    return this.setBounds(...args)
  }

  /**
   * Memorization is a way to keep track of the value and its derivatives over time.
   * 
   * Usage:
   * ```
   * const obs = new ObservableNumber(0)
   * 
   * obs.initMemorization(10, { derivativeCount: 2 })
   * 
   * // constant accelaration
   * for (let i = 1; i <= 5; i++) {
   *     obs.value = i
   * }
   * 
   * // increasing acceleration
   * for (let i = 2; i <= 6; i++) {
   *     obs.value += i
   * }
   * 
   * // position:
   * console.log('pos', ...obs.getMemorization().values())
   * // pos 25 19 14 10 7 5 4 3 2 1
   * 
   * // velocity (1st derivative):
   * console.log('vel', ...obs.getMemorization().derivative!.values())
   * // vel 6 5 4 3 2 1 1 1 1 1
   * 
   * // acceleration (2nd derivative):
   * console.log('acc', ...obs.getMemorization().derivative!.derivative!.values())
   * // acc 1 1 1 1 1 0 0 0 0 1
   * ```
   */
  initMemorization(memorizationLength: number, { derivativeCount = 0 } = {}): this {
    if (typeof arguments[1] === 'number') {
      console.warn('ObservableNumber.initMemorization(memorizationLength, derivativeCount) is deprecated. Use ObservableNumber.initMemorization(memorizationLength, { derivativeCount }) instead.')
      derivativeCount = arguments[1]
    }

    this._memorization = new Memorization(memorizationLength, this._value, derivativeCount)
    return this
  }

  getMemorization(): Memorization {
    return this._memorization!
  }

  isAboveOrEqual(threshold: number): boolean {
    return this._value >= threshold
  }

  /**
   * @deprecated Use `isAboveOrEqual` instead.
   */
  isAbove(threshold: number): boolean {
    return this.isAboveOrEqual(threshold)
  }

  isBelow(threshold: number): boolean {
    return this._value < threshold
  }

  isAboveOrEqualUpperbound(): boolean {
    return this._value >= this._upperBound
  }

  isBelowOrEqualLowerbound(): boolean {
    return this._value < this._lowerBound
  }

  passed(mode: PassMode, threshold: number): boolean {
    const { value, valueOld } = this
    const isAbove = value >= threshold && valueOld < threshold
    const isBelow = value < threshold && valueOld >= threshold
    switch (mode) {
      case 'through': return isAbove || isBelow
      case 'above': return isAbove
      case 'below': return isBelow
    }
    throw new Error('Impossible! Typescript, where are you?')
  }

  getPassMode(threshold: number): (typeof passModeValues)[0] | (typeof passModeValues)[1] | null {
    const { value, valueOld } = this
    const isAbove = value >= threshold && valueOld < threshold
    const isBelow = value < threshold && valueOld >= threshold
    if (isAbove) {
      return 'above'
    }
    if (isBelow) {
      return 'below'
    }
    return null
  }

  stepValue(step: number): number {
    return Math.round(this._value / step) * step
  }

  /**
   * Same as `onChange` but with a callback that will be called less often since
   * a step is applied to the value.
   */
  onStepChange(step: number, callback: Callback<number>): DestroyableObject
  onStepChange(step: number, options: OnChangeOptions, callback: Callback<number>): DestroyableObject
  onStepChange(...args: any[]): DestroyableObject {
    function solveArgs(args: any[]): [number, OnChangeOptions, Callback<number>] {
      if (args.length === 3) {
        return args as [number, OnChangeOptions, Callback<number>]
      }
      if (args.length === 2) {
        return [args[0], {}, args[1]]
      }
      throw new Error(`Invalid arguments: (${args.join(', ')})`)
    }
    const [step, options, callback] = solveArgs(args)
    let stepValue = NaN
    return this.onChange(options, () => {
      const newStepValue = this.stepValue(step)
      if (stepValue !== newStepValue) {
        stepValue = newStepValue
        callback(stepValue, this)
      }
    })
  }

  onPass(mode: PassMode, threshold: number, callback: Callback<number>): DestroyableObject {
    return this.onChange(() => {
      if (this.passed(mode, threshold)) {
        callback(this.value, this)
      }
    })
  }

  increment(delta = 1): boolean {
    return this.setValue(this._value + delta)
  }

  decrement(delta = 1): boolean {
    return this.setValue(this._value - delta)
  }

  /**
   * @param target The target value.
   * @param alpha The amount to change towards the target.
   * 
   * Changes the inner value towards the target by a certain amount.
   * 
   * Among options, `modulo` is a special case that allows to change the value 
   * in a circular way:
   * ```
   * const seconds = new ObservableNumber(55)
   * seconds.lerpTo(5, .1, { modulo: 60 })
   * console.log(seconds.value) // 56 (and not 50)
   * ```
   * 
   */
  lerpTo(target: number, alpha: number, {
    clamp = true,
    epsilon = 1e-9,
    modulo = -1,
  } = {}): boolean {
    const value = this._value
    if (modulo >= 0) {
      target = (target % modulo + modulo) % modulo
      const diff = target - value
      if (Math.abs(diff) > modulo / 2) {
        target = value + (diff > 0 ? diff - modulo : diff + modulo)
      }
      const newValue = Math.abs(target - value) < epsilon ? target :
        value + (target - value) * (clamp ? alpha < 0 ? 0 : alpha > 1 ? 1 : alpha : alpha)
      return this.setValue(newValue % modulo)
    }
    const newValue = Math.abs(target - value) < epsilon ? target :
      value + (target - value) * (clamp ? alpha < 0 ? 0 : alpha > 1 ? 1 : alpha : alpha)
    return this.setValue(newValue)
  }

  /**
   * Linear interpolation of the inner value between the two given values.
   * 
   * Note: This will not change the inner value. For that, use {@link lerpTo}.
   */
  lerp(a: number, b: number, options?: Partial<{ clamped: boolean }>): number {
    let alpha = this._value
    if (options?.clamped === true) {
      alpha = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha
    }
    return a + (b - a) * alpha
  }

  /**
   * Inverse linear interpolation of the inner value between the two given values.
   * 
   * If no values are given, the min and max of the observable are used.
   */
  inverseLerp(a: number = this.lowerBound, b: number = this.upperBound, options?: Partial<{ clamped: boolean }>): number {
    let alpha = (this._value - a) / (b - a)
    if (options?.clamped === true) {
      alpha = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha
    }
    return alpha
  }

  exponentialDecay(targetValue: number, decay: number, deltaTime: number): boolean {
    return this.setValue(calculateExponentialDecay(this._value, targetValue, decay, deltaTime))
  }

  /**
   * @deprecated Use {@link exponentialDecay} instead.
   * Grow the value exponentially towards the target.
   * 
   * If value = 100, target = 200, grow = 0.3, deltaTime = 1, then the new value will be 130.
   * 
   * This is useful for smooth transitions, whatever delta time is.
   * 
   * @param target The target value.
   * @param grow 
   * The amount to grow towards the target per second (e.g. 0.1 for 10%).
   * 
   * Grow can be a number (e.g. 0.1) or a tuple [value, deltaTime] (e.g. [0.1, 1]).
   * If it is a tuple, it means that the value will grow by the given value in the given time.
   * 
   * Example:  
   * If value = 100, target = 200, grow = [0.3, 1], deltaTime = 1, then the new value will be 130 after 0.1 seconds (and 197.17524751 after 1 second).
   * 
   * This is useful to express the grow for shorter periods of time than 1 second (in motion design 1 seconds is a very long time).
   * @param deltaTime The time elapsed since the last call.
   * @returns 
   */
  exponentialGrow(target: number, grow: number | [value: number, deltaTime: number], deltaTime: number): boolean {
    const computeDecay = (grow: number | [grow: number, deltaTime: number]) => {
      if (typeof grow === 'number') {
        return 1 - grow
      }
      const [value, deltaTime] = grow
      return (1 - value) ** (1 / deltaTime)
    }
    const decay = computeDecay(grow)
    const value = target - (target - this._value) * (decay ** deltaTime)
    return this.setValue(value)
  }
}
