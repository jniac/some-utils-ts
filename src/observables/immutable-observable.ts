import { DestroyableObject } from '../types'
import { ObservableCore } from './observable'

const noopReturn: DestroyableObject = { destroy: () => { } }

/**
 * An observable that never changes value.
 * 
 * Useful for optimization or semantic purposes when you want to indicate that a value is immutable.
 * 
 * Use case:
 * ```
 * // default value for an optional observable parameter
 * const obs = source?.myObs ?? ImmutableObservable.cached(defaultValue)
 * 
 * // in reactive code:
 * useObservableValue(source?.myObs ?? ImmutableObservable.cached(defaultValue))
 * ```
 */
export class ImmutableObservable<T> implements ObservableCore<T> {
  static #cache = new Map<any, ImmutableObservable<any>>()

  static cached<T>(value: T) {
    if (this.#cache.has(value)) {
      return this.#cache.get(value)!
    }
    const obs = new ImmutableObservable(value)
    this.#cache.set(value, obs)
    return obs
  }

  value: T

  onChange(_: () => void): DestroyableObject {
    return noopReturn
  }

  constructor(value: T) {
    this.value = value
  }
}
