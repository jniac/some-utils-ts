import { comparePaths, deepAssign, deepClone, deepGet, deepWalk, Path } from '../object/deep'
import { deepDiff, DeepDiffResult } from '../object/deep/diff'
import { DeepPartial } from '../types'

import { Observable, SetValueOptions } from './observable'

type PartialChangeCallback<T, SubType> =
  (partialValue: SubType, partialValueOld: SubType, info: { observable: ObservableTree<T>, path: Path }) => void

/**
 * Turn a path string or array into a nested object.
 */
function nested(path: string | Path, value: any) {
  if (typeof path === 'string') {
    path = path.split('.')
  }
  const obj = {} as any
  let scope = obj
  for (const key of path.slice(0, -1)) {
    scope[key] = {}
    scope = scope[key]
  }
  scope[path[path.length - 1]] = value
  return obj
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
  diff: DeepDiffResult = new DeepDiffResult({}, {})

  private _pendingMutations = null as null | DeepPartial<T>

  // Short syntax:
  mutate: (typeof this)['setMutation'] = this.setMutation.bind(this)

  setMutation(mutation: DeepPartial<T> | [path: string | Path, value: any], options?: SetValueOptions): boolean {
    if (!mutation || typeof mutation !== 'object') {
      throw new Error('Mutation must be an object.')
    }

    const { value: currentValue } = this
    const mutationObject = Array.isArray(mutation) ? nested(mutation[0], mutation[1]) : mutation

    // Check if the mutation is really mutating the tree.
    let doReallyMutate = false
    deepWalk(mutationObject, {
      treatConstructedObjectAsValue: false, // F***ing important! Since we are comparing the final primitive values.
      onValue(mutationValue, path) {
        const { value: existingValue, exists } = deepGet(currentValue, path)
        if (!exists || mutationValue !== existingValue) {
          doReallyMutate = true
          return 'break'
        }
      },
    })
    if (!doReallyMutate) {
      return false
    }

    // Deep clone the current value and apply the mutation.
    const newValue = deepClone(currentValue)
    deepAssign(newValue, mutationObject)
    this.diff = deepDiff(currentValue, newValue)

    return super.setValue(newValue, options)
  }

  /**
   * Enqueue a partial value to be set later.
   */
  enqueueMutation(mutation: DeepPartial<T> | [path: string | Path, value: any]): this {
    this._pendingMutations ??= {} as DeepPartial<T>
    deepAssign(this._pendingMutations, Array.isArray(mutation) ? nested(mutation[0], mutation[1]) : mutation)
    return this
  }

  /**
   * Flush all pending mutations.
   */
  flushMutations(options?: SetValueOptions): boolean {
    if (!this._pendingMutations) {
      return false
    }
    const hasChanged = this.setMutation(this._pendingMutations, options)
    this._pendingMutations = null
    return hasChanged
  }

  override setValue(incomingValue: T, options?: SetValueOptions): boolean {
    return this.setMutation(incomingValue as any, options)
  }

  onMutation<SubType = any>(path: string | Path, callback: PartialChangeCallback<T, SubType>) {
    const pathArray = Array.isArray(path) ? path : path.split('.')
    const pathLength = pathArray.length
    return this.onChange((value, { valueOld }) => {
      let hasChanged = false
      let path = null as null | Path
      for (const [diffPath] of this.diff!.bothChanges) {
        if (comparePaths(diffPath, pathArray, { maxLength: pathLength })) {
          hasChanged = true
          path = diffPath.slice(0, pathLength)
          break
        }
      }
      if (hasChanged) {
        const partialValue = deepGet(value, pathArray).value
        const partialValueOld = deepGet(valueOld, pathArray).value
        callback(partialValue, partialValueOld, { observable: this, path: path! })
      }
    })
  }
}
