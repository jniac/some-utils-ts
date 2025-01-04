import { comparePaths, deepAssign, deepClone, deepGet, Path } from '../object/deep'
import { deepDiff, DeepDiffResult } from '../object/deep/diff'
import { DeepPartial } from '../types'

import { Observable, SetValueOptions } from './observable'

type PartialChangeCallback<T> =
  (partialValue: any, info: { partialValueOld: any, observable: ObservableTree<T>, path: Path }) => void

function wrap(path: Path, value: any) {
  const obj = {} as any
  for (const key of path.slice(0, -1)) {
    obj[key] = {}
  }
  obj[path[path.length - 1]] = value
}

/**
 * An observable that "deeply" tracks changes to its value.
 * 
 * Usage: 
 * ```
 * const o = new ObservableTree({ foo: { bar: 2, qux: 3 } })
 * o.onMutation('foo', (v, { partialValueOld, path }) => {
 *   console.log(path.join('.'), v, partialValueOld)
 * })
 * o.onMutation('foo.bar', (v, { partialValueOld, path }) => {
 *   console.log(path.join('.'), v, partialValueOld)
 * })
 * o.setMutation({ foo: { bar: 12 } })
 * ```
 * 
 * NOTE: 
 * 
 * This observable is quite expensive to use since any change set with 
 * `setMutation` will trigger a deep diff and  a deep clone. Use with caution. 
 * For frequent changes (e.g. multiple mutation), consider using `enqueueMutation`
 * and `flushMutations` instead.
 * 
 * ```
 * const o = new ObservableTree({ foo: { bar: 2, qux: 3 } })
 * o.onMutation('foo', (v, { partialValueOld, path }) => {
 *   console.log(path.join('.'), v, partialValueOld)
 * })
 * o.onMutation('foo.bar', (v, { partialValueOld, path }) => {
 *   console.log(path.join('.'), v, partialValueOld)
 * })
 * o.enqueueMutation({ foo: { bar: 12 } })
 * o.enqueueMutation({ foo: { qux: 23 } })
 * o.enqueueMutation({ foo: { baz: 34 } })
 * o.flushMutations() // only triggers one deep diff and one deep clone
 * ```
 */
export class ObservableTree<T> extends Observable<T> {
  diff: null | DeepDiffResult = null

  private _pendingMutations = {} as DeepPartial<T>

  setMutation(mutation: DeepPartial<T> | [path: Path, value: any], options?: SetValueOptions): boolean {
    const newValue = deepClone(this.value)
    deepAssign(newValue, Array.isArray(mutation) ? wrap(mutation[0], mutation[1]) : mutation)
    this.diff = deepDiff(this.value, newValue)
    if (this.diff.totalChangeCount === 0) {
      return false
    }
    return super.setValue(newValue, options)
  }

  /**
   * Enqueue a partial value to be set later.
   */
  enqueueMutation(mutation: DeepPartial<T> | [path: Path, value: any]): this {
    deepAssign(this._pendingMutations, Array.isArray(mutation) ? wrap(mutation[0], mutation[1]) : mutation)
    return this
  }

  /**
   * Flush all pending mutations.
   */
  flushMutations(options?: SetValueOptions): boolean {
    return this.setMutation(this._pendingMutations, options)
  }

  override setValue(incomingValue: T, options?: SetValueOptions): boolean {
    return this.setMutation(incomingValue as any, options)
  }

  onMutation(path: string | Path, callback: PartialChangeCallback<T>) {
    const pathArray = Array.isArray(path) ? path : path.split('.')
    const pathLength = pathArray.length
    this.onChange((value, { valueOld }) => {
      let path = null as null | Path
      for (const [diffPath] of this.diff!.bothChanges) {
        if (comparePaths(diffPath, pathArray, { maxLength: pathLength })) {
          path = diffPath.slice(0, pathLength)
          break
        }
      }
      if (path) {
        const partialValue = deepGet(value, pathArray).value
        const partialValueOld = deepGet(valueOld, pathArray).value
        callback(partialValue, { partialValueOld, observable: this, path })
      }
    })
  }
}
