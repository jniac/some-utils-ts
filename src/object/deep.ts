import { DeepPartial } from '../types'

function isObject(value: any): value is any {
  return value !== null && typeof value === 'object'
}

const deepCloneMap = new Map<any, (source: any) => any>()

deepCloneMap.set(Date, (source: Date) => new Date(source.getTime()))
deepCloneMap.set(RegExp, (source: RegExp) => new RegExp(source.source, source.flags))

// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  deepCloneMap.set(DOMPoint, (source: DOMPoint) => new DOMPoint(source.x, source.y, source.z, source.w))
  // @ts-ignore
  deepCloneMap.set(DOMRect, (source: DOMRect) => new DOMRect(source.x, source.y, source.width, source.height))
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

  // @ts-ignore
  const clone = new constructor()
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
export function deepCopy<T extends object>(
  source: DeepPartial<T>,
  destination: T,
  allowNewKeys = false,
): boolean {
  let hasChanged = false

  function clone(srcValue: any, key: string | number) {
    // Objects:
    if (isObject(srcValue)) {
      // Dates:
      if (srcValue instanceof Date) {
        const destDate = (destination as any)[key] as Date
        if ((destDate instanceof Date) === false || destDate.getTime() !== srcValue.getTime()) {
          (destination as any)[key] = new Date(srcValue.getTime())
          hasChanged = true
        }
      }

      // Regular objects:
      else {
        hasChanged = deepCopy(srcValue, (destination as any)[key]) || hasChanged
      }
    }

    // Primitives:
    else {
      if ((destination as any)[key] !== srcValue) {
        (destination as any)[key] = srcValue
        hasChanged = true
      }
    }
  }

  if (Array.isArray(source)) {
    const len = allowNewKeys
      ? source.length
      : Math.min(source.length, (destination as any).length)
    for (let i = 0; i < len; i++) {
      const srcValue = source[i]
      clone(srcValue, i)
    }
  } else {
    for (const [key, srcValue] of Object.entries(source)) {
      if (allowNewKeys === false && key in destination === false) {
        continue
      }
      clone(srcValue, key)
    }
  }

  return hasChanged
}

type Path = (string | number | symbol)[]

const deepWalkOptions = {
  path: <Path | undefined>undefined,
  ascendants: <any[] | undefined>undefined,
  dateAsValue: true,
  /**
   * If true, any object with a constructor that is not Object or Array will be treated as a value.
   */
  withConstructorAsValue: true,
  onValue: <((value: any, path: Path, ascendants: any[]) => void) | null>null,
  onObject: <((value: any, path: Path, ascendants: any[]) => void) | null>null,
}
/**
 * Walks through the target object deeply and invokes the specified callbacks.
 */
export function deepWalk(target: any, options: Partial<typeof deepWalkOptions> = {}) {
  const {
    path = [],
    ascendants = [],
    dateAsValue: dateAsValue = deepWalkOptions.dateAsValue,
    withConstructorAsValue = deepWalkOptions.withConstructorAsValue,
  } = options
  if (dateAsValue && target instanceof Date) {
    options.onValue?.(target, path, ascendants)
  }
  else if (isObject(target) === false) {
    options.onValue?.(target, path, ascendants)
  }
  else if (withConstructorAsValue && target.constructor !== Object && target.constructor !== Array) {
    options.onValue?.(target, path, ascendants)
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





/**
 * Compares two objects deeply and returns the differences in a diff object.
 */
export function deepDiff<TypeA, TypeB>(objectA: TypeA, objectB: TypeB) {
  const info = {
    differences: 0,
    aOnly: [] as [Path, value: any][],
    bOnly: [] as [Path, value: any][],
    changes: [] as [Path, aValue: any, bValue: any][],
    a: {} as DeepPartial<TypeA>,
    b: {} as DeepPartial<TypeB>,
  }

  deepWalk(objectA, {
    onValue(aValue, path) {
      const { value: bValue, exists } = deepGet(objectB, path)
      if (!exists || aValue !== bValue) {
        if (!exists) {
          info.differences++
          info.aOnly.push([path, aValue])
        } else {
          info.differences++
          info.changes.push([path, aValue, bValue])
        }
        deepSet(info.a, path, aValue, { createAscendants: true })
      }
    },
  })

  deepWalk(objectB, {
    onValue(bValue, path) {
      const { value: aValue, exists } = deepGet(objectA, path)
      if (!exists || bValue !== aValue) {
        if (!exists) {
          info.differences++
          info.bOnly.push([path, bValue])
        } else {
          // Nothing... (Do not push change paths twice).
        }
        deepSet(info.b, path, bValue, { createAscendants: true })
      }
    },
  })

  return info
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

// import('./deep.test').then(({ test }) => test())