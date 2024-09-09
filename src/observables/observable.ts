import { DestroyableObject } from '../types'
import { Delay, clearDelay, withDelay } from './delay'

/**
 * ObservableCore is the very basic interface for an observable. It is exposed
 * sperately to allow to any kind of object to be observable (and work with 
 * existing observables and hooks).
 */
type ObservableCore<T> = {
  value: T
  onChange(callback: () => void): DestroyableObject
}

type ValueMapper<T> =
  (incomingValue: T, observable: Observable<T>) => T

type ConstructorOptions<T> = Partial<{
  /** A value mapper to authorize, clamp, rewrite and other fancy effects. */
  valueMapper: ValueMapper<T>
  /** A first optional listener (that could not be destroyed). */
  onChange: Callback<T>
  /** A user data object to store any kind of data. */
  userData: Record<string, any>
}>

type SetValueOptions = Partial<{
  /**
   * A delay before applying the change.
   *
   * That option is tricky and has huge side effects. Use with caution.
   *
   * NOTE: Very opionated design: Any update in the mean time, delayed OR NOT,
   * that changes OR NOT the inner value, will cancel the delayed change.
   */
  delay: Delay
}>

type Callback<T> =
  (value: T, observable: Observable<T>) => void

type DerivativeCallback<T, D> =
  (derivative: D, derivativeOld: D, value: T, observable: Observable<T>) => void

type VerifyCallback<T> =
  (verify: boolean, value: T, observable: Observable<T>) => void

type OnChangeOptions = Partial<{
  executeImmediately: boolean
  once: boolean
}>

let observableNextId = 0

/**
 * Observable is a very simple wrapper around a value (any kind) that makes it
 * to observe changes on that value.
 *
 * It also facilitates
 * - to define "value-mapper" that rewrite internally the value
 * (eg: min / max bounds to number value)
 * - to react to "derived value" (eg: boolean that compare a number value to a
 * threshold)
 *
 * Other benefits may comes from the fact that:
 * - any subscription return a "destroy" function to facilitates... unsubscription.
 * - "setValue()", after having eventually remapped the value, performs an internal
 * check against the current value and do nothing if the value is the same (optim).
 * - it is eventually declined to specific flavour for even more convenience
 * (eg: ObservableNumber)
 *
 * Usage:
 * ```
 * const statusObs = new Observable<'none' | 'pending' | 'ready'>('none')
 * statusObs.onChange(status => {
 *   if (value === 'ready') {
 *     doFancyThings()
 *   }
 * })
 * statusObs.value = 'ready'
 * ```
 */
class Observable<T = any> implements ObservableCore<T> {
  static get nextId() { return observableNextId }

  protected readonly _observableId = observableNextId++
  protected _value: T
  protected _valueOld: T
  protected _valueMapper: ValueMapper<T> | null = null
  protected _listeners: Set<Callback<T>> = new Set()
  protected _hasChanged: boolean = false
  protected _delayed: boolean = false

  userData: Record<string, any>

  constructor(intialValue: T, options?: ConstructorOptions<T>) {
    this._value = intialValue
    this._valueOld = intialValue

    const {
      valueMapper = null,
      onChange,
      userData = {},
    } = options ?? {}

    this._valueMapper = valueMapper
    this.userData = userData

    if (onChange) {
      this.onChange(onChange)
    }
  }

  /**
   * Handy method to check the inner value in a declarative way:
   * ```
   * if (statusObs.is('ready')) {
   *   doFancyThings()
   * }
   * ```
   */
  is(value: T): boolean {
    return this._value === value
  }

  protected _invokeListeners(): void {
    const it = this._listeners[Symbol.iterator]()
    while (true) {
      const { value, done } = it.next()
      if (done) break
      value(this._value, this)
    }
  }

  /**
   * Handle the delay internally. Returns true if the observable is delayed, false otherwise.
   */
  protected _handleDelay(incomingValue: T, options?: SetValueOptions): boolean {
    if (options?.delay !== undefined) {
      const { delay, ...optionsWithoutDelay } = options
      withDelay(this, delay, () => {
        this.setValue(incomingValue, optionsWithoutDelay)
      })
      this._delayed = true
      return true
    } else {
      if (this._delayed) {
        clearDelay(this)
      }
      this._delayed = false
      return false
    }
  }

  /**
   * `setValue` makes several things:
   *   - First if a delay is defined, handle the delay.
   * 	 - Then the incoming value is remapped (eg: by applying min, max bounds).
   * 	 - Then the remapped value is compared with the inner one.
   * 	 - If the values are identical, it returns false (meaning: nothing happened)
   * 	 - Otherwise it changes the inner value, call all the listeners and returns true (meaning: something happened).
   * @param incomingValue
   * @returns
   */
  setValue(incomingValue: T, options?: SetValueOptions): boolean {
    // Delay special case:
    if (this._handleDelay(incomingValue, options)) {
      return false
    }

    // No more delay, regular case:
    if (this._valueMapper) {
      incomingValue = this._valueMapper(incomingValue, this)
    }
    if (incomingValue === this._value) {
      this._hasChanged = false
      return false
    }
    this._valueOld = this._value
    this._value = incomingValue
    this._hasChanged = true
    this._invokeListeners()
    return true
  }

  protected valueStringifier: ((value: T) => string) | null = null
  protected valueParser: ((value: string) => T) | null = null

  initializeSerialization(
    valueStringifier: (value: T) => string,
    valueParser: (value: string) => T
  ): this {
    this.valueStringifier = valueStringifier
    this.valueParser = valueParser
    return this
  }

  valueToString(): string {
    if (this.valueStringifier) {
      return this.valueStringifier(this._value)
    }
    return String(this._value)
  }

  /**
   * Usefull to set the value from a string (eg: from a serialized value).
   */
  setValueFromString(value: string, options?: SetValueOptions): boolean {
    if (this.valueParser) {
      const parsedValue = this.valueParser(value)
      return this.setValue(parsedValue, options)
    }
    const type = typeof this._value
    switch (type) {
      case 'string':
        return this.setValue(value as T, options)
      case 'number':
        return this.setValue(Number(value) as T, options)
      case 'boolean':
        const booleanValue = /^true|1$/.test(value)
        return this.setValue(booleanValue as T, options)
      case 'bigint':
        return this.setValue(BigInt(value) as T, options)
      default:
        console.warn(`Observable#setValueFromString: Unsupported type "${type}"`)
        return false
    }
  }



  /**
   * Since the valueMapper can change the inner value, defining a new value mapper
   * with a non-null value internally invokes setValue() and returns the result.
   * @param valueMapper
   * @returns
   */
  setValueMapper(valueMapper: ValueMapper<T> | null): boolean {
    this._valueMapper = valueMapper
    return valueMapper
      ? this.setValue(valueMapper(this._value, this))
      : false
  }

  clearListeners(): this {
    this._listeners.clear()
    return this
  }

  onChange(callback: Callback<T>): DestroyableObject
  onChange(options: OnChangeOptions, callback: Callback<T>): DestroyableObject
  onChange(...args: any[]): DestroyableObject {
    const [options, callback] = (args.length === 2 ? args : [{}, args[0]]) as
      [OnChangeOptions, Callback<T>]

    const {
      executeImmediately = false,
      once = false,
    } = options

    if (once) {
      // No need to store the callback in the listeners set.
      if (executeImmediately) {
        callback(this._value, this)
        return { destroy: () => { } }
      }

      // Destroyable object that will destroy itself after the first call.
      const destroyable = this.onChange({ ...options, executeImmediately: false, once: false }, (value, obs) => {
        destroyable.destroy()
        callback(value, obs)
      })

      return destroyable
    }

    this._listeners.add(callback)

    const destroy = () => this._listeners.delete(callback)

    if (executeImmediately) {
      callback(this._value, this)
    }

    return { destroy }
  }

  onDerivativeChange<D>(derivativeExtractor: (value: T) => D, callback: DerivativeCallback<T, D>): DestroyableObject
  onDerivativeChange<D>(derivativeExtractor: (value: T) => D, options: OnChangeOptions, callback: DerivativeCallback<T, D>): DestroyableObject
  onDerivativeChange<D>(derivativeExtractor: (value: T) => D, ...args: any[]): DestroyableObject {
    let derivative = derivativeExtractor(this._value)
    const [{
      executeImmediately = false,
    }, callback] = (args.length === 2 ? args : [{}, args[0]]) as
      [OnChangeOptions, DerivativeCallback<T, D>]
    if (executeImmediately) {
      callback(derivative, derivative, this._value, this)
    }
    return this.onChange(value => {
      const derivativeOld = derivative
      derivative = derivativeExtractor(value)
      if (derivative !== derivativeOld) {
        callback(derivative, derivativeOld, value, this)
      }
    })
  }

  onVerify(predicate: (value: T) => boolean, callback: VerifyCallback<T>): DestroyableObject
  onVerify(options: OnChangeOptions, predicate: (value: T) => boolean, callback: VerifyCallback<T>): DestroyableObject
  onVerify(...args: any[]): DestroyableObject {
    // Solve args:
    const [options, predicate, callback] = (args.length === 3
      ? args
      : [{}, ...args]
    ) as [options: OnChangeOptions, predicate: (value: T) => boolean, callback: VerifyCallback<T>]

    // Go on:
    let verify = predicate(this._value)
    if (options.executeImmediately) {
      callback(verify, this._value, this)
    }
    return this.onChange(value => {
      const newVerify = predicate(value)
      if (newVerify !== verify) {
        verify = newVerify
        callback(verify, value, this)
      }
    })
  }

  // Sugar syntax:
  get observableId() { return this._observableId }
  get value() { return this._value }
  set value(value) { this.setValue(value) }
  get valueOld() { return this._valueOld }

  // Short syntax:
  get: () => T = () => this._value
  set: (typeof this)['setValue'] = this.setValue.bind(this)

  // Debug
  log(value?: (value: T) => string): DestroyableObject
  log(options?: { value: (value: T) => string, message: (obs: Observable<T>) => string }): DestroyableObject
  log(...args: any[]): DestroyableObject {
    function solveArgs() {
      if (args.length === 1) {
        if (typeof args[0] === 'function') {
          return { value: args[0] }
        } else {
          return args[0]
        }
      } else {
        return {}
      }
    }
    const {
      value = (value: T) => value?.toString() ?? String(value),
      message = (obs: Observable<T>) => `Obs#${this._observableId} value has changed: `,
    } = solveArgs()
    return this.onChange(() => {
      console.log(`${message(this)} ${value(this._value)}`)
    })
  }
}

export type {
  Callback,
  ConstructorOptions,
  DerivativeCallback,
  ObservableCore,
  OnChangeOptions,
  SetValueOptions
}

export {
  Observable
}

