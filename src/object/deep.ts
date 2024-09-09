import { DeepPartial } from '../types'

function isObject(value: any): value is object {
  return value !== null && typeof value === 'object'
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
  if (constructor === RegExp || constructor === Date) {
    // @ts-ignore
    return new constructor(target)
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
  path: <Path | null>null,
  ascendants: <any[] | null>null,
  dateAsValue: true,
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
  if (withConstructorAsValue && target.constructor !== Object && target.constructor !== Array) {
    options.onValue?.(target, path, ascendants)
  }
  else if (isObject(target)) {
    options.onObject?.(target, path, ascendants)
    for (const key in target) {
      deepWalk(target[key], {
        ...options,
        path: [...path, key],
        ascendants: [...ascendants, target],
      })
    }
  }
  else {
    options.onValue?.(target, path, ascendants)
  }
}

/**
 * Deeply gets a value from the target object at the specified path.
 */
export function deepGet(target: any, path: Path | string): { value: any, exists: boolean } {
  if (typeof path === 'string') {
    path = path.split('.')
  }
  let value = target
  for (const key of path) {
    if (key in value) {
      value = value[key]
    }
    else {
      return { value: undefined, exists: false }
    }
  }
  return { value, exists: true }
}

const deepSetOptions = {
  ascendantsModel: <any[] | null>null,
  createAscendants: true,
}
/**
 * Deeply sets a value in the target object at the specified path.
 */
export function deepSet(target: any, path: Path | string, value: any, options: Partial<typeof deepSetOptions> = {}): { success: boolean, createdAscendants: boolean } {
  if (typeof path === 'string') {
    path = path.split('.')
  }
  const {
    ascendantsModel,
    createAscendants = deepSetOptions.createAscendants,
  } = options
  let scope = target
  let createdAscendants = false
  for (let index = 0, max = path.length - 1; index < max; index++) {
    const key = path[index]
    if (key in scope === false) {
      if (createAscendants) {
        const source = scope[key]
        if (source === undefined) {
          const ascendant = ascendantsModel?.[index] ?? (typeof path[index] === 'number' ? [] : {})
          scope[key] = ascendant
          scope = ascendant
          createdAscendants = true
        }
      }
      else {
        return { success: false, createdAscendants }
      }
    }
  }
  scope[path[path.length - 1]] = value
  return { success: true, createdAscendants }
}

/**
 * Compares two objects deeply and returns the differences in a diff object.
 */
export function deepDiff(objectA: any, objectB: any) {
  const diff = {
    a: {},
    b: {},
  }
  deepWalk(objectA, {
    onValue(value, path) {
      const { value: valueB, exists } = deepGet(objectB, path)
      if (exists === false || value !== valueB) {
        deepSet(diff.a, path, value, { createAscendants: true })
      }
    },
  })
  deepWalk(objectB, {
    onValue(value, path) {
      const { value: valueA, exists } = deepGet(objectA, path)
      if (exists === false || value !== valueA) {
        deepSet(diff.b, path, value, { createAscendants: true })
      }
    },
  })
  return diff
}
