import { Observable } from './observable'
import { ObservableTree } from './observable-tree'

type ObservableStructure =
  | readonly Observable<any>[]
  | Record<string, Observable<any>>

type Unwrap<T> = {
  [K in keyof T]: T[K] extends Observable<infer V> ? V : never
}

function unwrap<T extends ObservableStructure>(input: T): Unwrap<T> {
  if (Array.isArray(input)) {
    return input.map(obs => obs.get()) as Unwrap<T>
  } else {
    const result: any = {}
    for (const key in input) {
      result[key] = (input[key] as Observable<any>).get()
    }
    return result
  }
}

/**
 * Combines multiple observables into a single observable by applying a reducer function.
 * 
 * Note: 
 * - The returned observable is an ObservableTree, which means it supports nested 
 * structures (but still supports flat structures and primitives).
 * - When using tuples, don't use `as const` when passing the array, as it will
 * break the type inference.
 */
export function combineObservables<T extends ObservableStructure, V>(
  observables: T,
  reducer: (value: Unwrap<T>) => V,
  callback?: (value: V) => void,
): {
  observable: Observable<V>
  destroy: () => void
} {
  const initialValue = reducer(unwrap(observables))
  const observable = new ObservableTree(initialValue)
  const onUpdate = () => {
    observable.set(reducer(unwrap(observables)))
    callback?.(observable.get())
  }

  const onDestroyCallbacks: (() => void)[] = []
  const destroy = () => {
    for (const cb of onDestroyCallbacks) {
      cb()
    }
  }

  if (Array.isArray(observables)) {
    for (const obs of observables as readonly Observable<any>[]) {
      onDestroyCallbacks.push(obs.onChange(onUpdate).destroy)
    }
  } else {
    for (const obs of Object.values(observables as Record<string, Observable<any>>)) {
      onDestroyCallbacks.push(obs.onChange(onUpdate).destroy)
    }
  }

  return {
    observable,
    destroy,
  }
}
