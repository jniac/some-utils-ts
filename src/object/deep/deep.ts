import { DeepPartial, DeepReadonly } from '../../types'

export type Path = (string | number | symbol)[]

export function comparePaths(a: Path, b: Path, {
  maxLength = Infinity,
  useLooseEquality = true,
} = {}) {
  const aLen = Math.min(a.length, maxLength)
  const bLen = Math.min(b.length, maxLength)
  if (aLen !== bLen) {
    return false
  }
  if (useLooseEquality) {
    for (let i = 0; i < aLen; i++) {
      if (a[i] != b[i]) {
        return false
      }
    }
    return true
  }
  for (let i = 0; i < aLen; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

function isObject(value: any): value is any {
  return value !== null && typeof value === 'object'
}

const deepCloneMap = new Map<any, (source: any) => any>()

deepCloneMap.set(Date, (source: Date) => new Date(source.getTime()))
deepCloneMap.set(RegExp, (source: RegExp) => new RegExp(source.source, source.flags))

// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  deepCloneMap.set(DOMPoint, (source: DOMPoint) => DOMPoint.fromPoint(source))
  // @ts-ignore
  deepCloneMap.set(DOMRect, (source: DOMRect) => DOMRect.fromRect(source))
}

/**
 * Clones an object deeply.
 *
 * NOTE:
 * - Objects are cloned by invoking their constructor, so they must be instantiable
 *   without arguments.
 */
export function deepClone<T>(target: T): T {
  // Primitives
  if (isObject(target) === false) {
    return target
  }

  // Objects
  // @ts-ignore
  const constructor = target.constructor
  const cloner = deepCloneMap.get(constructor)
  if (cloner) {
    return cloner(target)
  }

  // Rely on the `clone` method if it exists.
  if ('clone' in (target as any) && typeof (target as any).clone === 'function') {
    return (target as any).clone()
  }

  // @ts-ignore
  const clone = new constructor()

  // Rely on the `copy` method if it exists.
  if ('copy' in (target as any) && typeof (target as any).copy === 'function') {
    clone.copy(target)
    return clone
  }

  if (Array.isArray(target)) {
    for (let i = 0, len = target.length; i < len; i++) {
      clone[i] = deepClone(target[i])
    }
  } else {
    // @ts-ignore
    for (const [key, value] of Object.entries(target)) {
      clone[key] = deepClone(value)
    }
  }
  return clone
}

/**
 * Performs a deep copy of the `source` object into the `destination` object.
 *
 * Returns `true` if the destination object has changed.
 */
export function deepCopy<T extends object = any>(
  source: DeepPartial<T>,
  destination: T,
  allowNewKeys = false,
): boolean {
  let hasChanged = false

  if (Array.isArray(source)) {
    const len = source.length;
    (destination as any[]).length = len
    for (let i = 0; i < len; i++) {
      const srcValue = source[i]
      if (isObject(srcValue)) {
        const childHasChanged = deepCopy(srcValue, (destination as any)[i], allowNewKeys)
        hasChanged = childHasChanged || hasChanged
      } else {
        if ((destination as any)[i] !== srcValue) {
          (destination as any)[i] = srcValue
          hasChanged = true
        }
      }
    }
  } else {
    for (const [key, srcValue] of Object.entries(source)) {
      if (allowNewKeys === false && key in destination === false) {
        continue
      }
      if (isObject(srcValue)) {
        const childHasChanged = deepCopy(srcValue, (destination as any)[key], allowNewKeys)
        hasChanged = childHasChanged || hasChanged
      } else {
        if ((destination as any)[key] !== srcValue) {
          (destination as any)[key] = srcValue
          hasChanged = true
        }
      }
    }
  }

  return hasChanged
}

const deepWalkOptions = {
  path: <Path | undefined>undefined,
  ascendants: <any[] | undefined>undefined,
  dateAsValue: true,
  /**
   * If true, the function will treat constructed objects as values.
   * 
   * Constructed objects are objects created with a constructor function.
   * For example, if `true`, the function will treat `new MyClass()` as a value.
   * 
   * Default: `true`.
   */
  treatConstructedObjectAsValue: true,
  onValue: <((value: any, path: Path, ascendants: any[]) => void | 'break') | null>null,
  onObject: <((value: any, path: Path, ascendants: any[]) => void | 'break') | null>null,
}
/**
 * Walks through the target object deeply and invokes the specified callbacks.
 * 
 * NOTE: If the `onValue` callback returns `'break'`, the function will stop walking.
 * Use this to break the loop early.
 */
export function deepWalk(target: any, options: Partial<typeof deepWalkOptions> = {}) {
  const {
    path = [],
    ascendants = [],
    dateAsValue: dateAsValue = deepWalkOptions.dateAsValue,
    treatConstructedObjectAsValue: withConstructorAsValue = deepWalkOptions.treatConstructedObjectAsValue,
  } = options
  if (dateAsValue && target instanceof Date) {
    const result = options.onValue?.(target, path, ascendants)
    if (result === 'break') {
      return
    }
  }
  else if (isObject(target) === false) {
    const result = options.onValue?.(target, path, ascendants)
    if (result === 'break') {
      return
    }
  }
  else if (withConstructorAsValue && target.constructor !== Object && target.constructor !== Array) {
    const result = options.onValue?.(target, path, ascendants)
    if (result === 'break') {
      return
    }
  }
  else {
    options.onObject?.(target, path, ascendants)
    for (const key in target) {
      deepWalk(target[key], {
        ...options,
        path: [...path, key],
        ascendants: [...ascendants, target],
      })
    }
  }
}

/**
 * Deeply gets a value from the target object at the specified path.
 */
export function deepGet(target: any, path: Path | string): { value: any, exists: boolean } {
  if (typeof path === 'string') {
    path = path.split('.')
  }
  let scope = target
  for (const key of path) {
    if (isObject(scope) && key in scope) {
      scope = scope[key]
    }
    else {
      return { value: undefined, exists: false }
    }
  }
  return { value: scope, exists: true }
}





const defaultDeepSetOptions = {
  ascendantsModel: <any[] | object | null>null,
  /**
   * If true, the function will create the ascendants if they don't exist.
   */
  createAscendants: true,
  /**
   * If true, the function will pierce through null or undefined values to create the ascendants.
   */
  pierceNullOrUndefined: true,
}

type DeepSetOptions = Partial<typeof defaultDeepSetOptions>

enum DeepSetFailureReason {
  None = 'none',
  NotAnObject = 'not-an-object',
  InvalidIndex = 'invalid-index',
  CannotCreateAscendants = 'cannot-create-ascendants',
  CannotPierceNullOrUndefined = 'cannot-pierce-null-or-undefined',
}

type DeepSetResult = {
  success: boolean
  failureReason: DeepSetFailureReason
  hasCreatedAscendants: boolean
}

/**
 * Deeply sets a value in the target object at the specified path.
 * 
 * NOTE: This has been partially tested. Quite trustable. See `deep.test.ts`.
 */
export function deepSet(
  target: any,
  path: Path | string,
  value: any,
  options: DeepSetOptions = {},
): DeepSetResult {
  if (isObject(target) === false) {
    return { success: false, hasCreatedAscendants: false, failureReason: DeepSetFailureReason.NotAnObject }
  }

  if (typeof path === 'string') {
    path = path.split('.')
  }

  const {
    ascendantsModel,
    createAscendants,
    pierceNullOrUndefined,
  } = { ...defaultDeepSetOptions, ...options }

  let scope = target
  let parent = scope
  let hasCreatedAscendants = false

  const max = path.length - 1
  for (let index = 0; index < max; index++) {
    parent = scope

    const key = path[index]

    if (isObject(scope) === false) {
      return { success: false, hasCreatedAscendants, failureReason: DeepSetFailureReason.NotAnObject }
    }

    if (key in scope) {
      scope = scope[key]
    }

    else if (Array.isArray(scope)) {
      const index = typeof key === 'number' ? key : Number.parseInt(key as string)
      if (isNaN(index) || index < 0) {
        return { success: false, hasCreatedAscendants, failureReason: DeepSetFailureReason.InvalidIndex }
      }
      scope = scope[index]
    }

    // Create the ascendant if it doesn't exist.
    else {
      if (createAscendants === false) {
        return { success: false, hasCreatedAscendants, failureReason: DeepSetFailureReason.CannotCreateAscendants }
      }

      let ascendant: any = null
      if (ascendantsModel === null || ascendantsModel === undefined) {
        // Create an array or an object depending on the next key.
        ascendant = typeof path[index + 1] === 'number' ? [] : {}
      }
      // Array:
      else if (Array.isArray(ascendantsModel)) {
        const value = ascendantsModel[index]
        ascendant = deepClone(value)
      }
      // Object:
      else {
        const { value } = deepGet(ascendantsModel, path.slice(0, index))
        ascendant = deepClone(value)
      }

      scope[key] = ascendant
      scope = ascendant
      hasCreatedAscendants = true
    }

    if (scope === undefined || scope === null) {
      if (pierceNullOrUndefined === false) {
        return { success: false, hasCreatedAscendants, failureReason: DeepSetFailureReason.CannotPierceNullOrUndefined }
      }

      // Redefine the current scope.
      scope = typeof path[index + 1] === 'number' ? [] : {}
      parent[key] = scope
    }
  }

  const lastKey = path[path.length - 1]
  scope[lastKey] = value

  return { success: true, hasCreatedAscendants, failureReason: DeepSetFailureReason.None }
}



const defaultDeepAssignOptions = {
  ignoreUndefined: false,
}

/**
 * Similar to `Object.assign`, but performs a deep assignment with some specified options.
 * 
 * NOTE: Use this very carefully, it has not been tested thoroughly.
 */
export function deepAssignWithOptions<T = any>(options: Partial<typeof defaultDeepAssignOptions>, target: any, ...sources: any[]): T {
  const { ignoreUndefined } = { ...defaultDeepAssignOptions, ...options }
  for (const source of sources) {
    deepWalk(source, {
      onValue(value, path) {
        // Skip undefined values.
        if (ignoreUndefined && value === undefined) {
          return
        }

        deepSet(target, path, value, { createAscendants: true })
      },
    })
  }
  return target
}

/**
 * Similar to `Object.assign`, but performs a deep assignment.
 */
export function deepAssign<T = any>(target: any, ...sources: any[]): T {
  return deepAssignWithOptions({}, target, ...sources)
}

export function deepFreeze<T = any>(obj: T): DeepReadonly<T> {
  Object.freeze(obj)
  if (isObject(obj)) {
    for (const key in obj) {
      deepFreeze(obj[key])
    }
  }
  return obj
}

// import('./deep.test').then(({ test }) => test())