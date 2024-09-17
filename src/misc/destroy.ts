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
