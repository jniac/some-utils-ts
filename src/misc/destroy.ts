import { Destroyable, DestroyableObject } from '../types'

/**
 * Simplifies the destruction of objects and functions.
 * 
 * Will execute the `destroy` method on all passed arguments, whether they are 
 * objects or functions.
 */
export function destroy(...destroyables: Destroyable[]): void
export function destroy(destroyables: Destroyable[]): void
export function destroy(...destroyables: Destroyable[] | Destroyable[][]): void {
  for (const destroyable of destroyables.flat(2)) {
    if ('destroy' in destroyable) {
      destroyable.destroy()
    } else {
      destroyable()
    }
  }
}

export function flatDestroyables(
  ...values: (Destroyable | null | undefined | Iterable<Destroyable | null | undefined>)[]
): Destroyable[] {
  const result: Destroyable[] = []
  for (const value of values) {
    if (value) {
      if (Symbol.iterator in value) {
        for (const destroyable of value) {
          if (destroyable) {
            result.push(destroyable)
          }
        }
      } else {
        result.push(value)
      }
    }
  }
  return result
}

export class DestroyableInstance<T = null> {
  #destroyables = new Set<Destroyable>()
  #destroyed = false

  customData: T

  get destroyed() {
    return this.#destroyed
  }

  constructor(customData?: T) {
    this.customData = (customData ?? null) as T
  }

  /**
   * Bind this instance to a parent instance, allowing it to be collected and 
   * destroyed when the parent is destroyed.
   * 
   * Note:
   * - ⚠️ This cannot be undone.
   */
  bindTo(parentInstance: DestroyableInstance<T>): this {
    if (this.#destroyed)
      return this

    parentInstance.collect(this)

    return this
  }

  collect(...values: (Destroyable | null | undefined | Iterable<Destroyable | null | undefined>)[]): DestroyableObject {
    if (this.#destroyed)
      return { destroy: () => { } }

    const safeDestroyables = flatDestroyables(...values)

    for (const destroyable of safeDestroyables)
      this.#destroyables.add(destroyable)

    const destroy = () => {
      for (const destroyable of safeDestroyables)
        this.#destroyables.delete(destroyable)
    }

    return { destroy }
  }

  /**
   * Destroy all collected destroyables.
   * 
   * NOTE: This method is bound to the instance and can be passed as a callback.
   */
  destroy = () => {
    if (this.#destroyed)
      return

    this.#destroyed = true

    for (const destroyable of this.#destroyables) {
      if (typeof destroyable === 'function') {
        destroyable()
      } else if ('destroy' in destroyable) {
        destroyable.destroy()
      }
    }
    this.#destroyables.clear()
  }
}

