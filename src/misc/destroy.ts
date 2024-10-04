import { Destroyable } from '../types'

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

export class DestroyableInstance {
  destroyables: Destroyable[] = []

  collect(...values: (Destroyable | null | undefined | Iterable<Destroyable | null | undefined>)[]) {
    for (const value of values) {
      if (value) {
        if (Symbol.iterator in value) {
          for (const destroyable of value) {
            if (destroyable) {
              this.destroyables.push(destroyable)
            }
          }
        } else {
          this.destroyables.push(value)
        }
      }
    }
  }

  /**
   * Destroy all collected destroyables.
   * 
   * NOTE: This method is bound to the instance and can be passed as a callback.
   */
  destroy = () => {
    destroy(this.destroyables)
    this.destroyables = []
  }
}

