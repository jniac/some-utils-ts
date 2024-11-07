import { formatNumber } from './string/number'
import { Vector2Like, Vector3Like, Vector4Like } from './types'

/**
 * Because readonly types are compatible with their mutable counterparts, we can use this type to handle both cases.
 */
type ReadonlyOrNot<T> = T | Readonly<T>

type Vector2DeclarationBase<T> =
  | T
  | [x: T, y: T]
  | { x: T; y: T }
  | { width: T; height: T }

export type Vector2Declaration<T = number> = ReadonlyOrNot<Vector2DeclarationBase<T>>

type Vector3DeclarationBase<T> =
  | T
  | [x: T, y: T, z?: T]
  | { x: T; y: T; z?: T }
  | { width: T; height: T; depth?: T }

export type Vector3Declaration<T = number> = ReadonlyOrNot<Vector3DeclarationBase<T>>

type Vector4DeclarationBase<T> =
  | T
  | [x: T, y: T, z?: T, w?: T]
  | { x: T; y: T; z?: T, w?: T }
  | { width: T; height: T; depth?: T; time?: T }
  | { top: T; right: T; bottom: T; left: T }

export type Vector4Declaration<T = number> = ReadonlyOrNot<Vector4DeclarationBase<T>>

export const angleUnits = ['rad', 'deg', 'turn'] as const
export type AngleUnit = typeof angleUnits[number]
export type AngleDeclaration = number | `${number}` | `${number}${AngleUnit}` | `${number}/${number}${AngleUnit}`
export const angleScalars: Record<AngleUnit, number> = {
  rad: 1,
  deg: Math.PI / 180,
  turn: Math.PI * 2,
}

export function isAngleUnit(arg: any): arg is AngleUnit {
  return typeof arg === 'string' && angleUnits.includes(arg as any)
}

/**
 * Transforms the given angle declaration into a number in radians.
 */
export function fromAngleDeclaration(declaration: AngleDeclaration, defaultUnit: AngleUnit = 'rad'): number {
  let unit: AngleUnit = defaultUnit
  let value: number = 0
  if (typeof declaration === 'number') {
    value = declaration
  } else {
    const match = declaration.match(/^\s*(-?[0-9.]+)\s*(\/\s*-?[0-9.]+)?\s*(rad|deg|turn)\s*$/)
    if (match) {
      const [_, v, d, u] = match
      value = Number.parseFloat(v)
      if (d) {
        value /= Number.parseFloat(d.slice(1))
      }
      unit = u as AngleUnit
    } else {
      value = Number.parseFloat(declaration)
    }
  }
  return value * angleScalars[unit]
}

export function toAngleDeclarationString(value: number, unit: AngleUnit = 'rad'): string & AngleDeclaration {
  return `${formatNumber(value / angleScalars[unit])}${unit}` as any
}

type IsBaseType<T> = (v: any) => v is T

function isNumber<T>(v: any): v is T {
  return typeof v === 'number'
}

export function isVector2Declaration<BaseType = number>(arg: any, isBaseType = isNumber<BaseType>): arg is Vector2Declaration<BaseType> {
  if (isBaseType(arg)) return true
  if (Array.isArray(arg)) return arg.length >= 2 && arg.length <= 3 && arg.every(v => isBaseType(v))
  if (typeof arg === 'object') {
    if ('x' in arg && 'y' in arg) return isBaseType(arg.x) && isBaseType(arg.y)
    if ('width' in arg && 'height' in arg) return isBaseType(arg.width) && isBaseType(arg.height)
  }
  return false
}

export function fromVector2Declaration<BaseType = number, T extends Vector2Like<BaseType> = Vector2Like<BaseType>>(
  arg: Vector2Declaration<BaseType>,
  out?: T,
  defaultValue?: BaseType,
  isBaseType?: IsBaseType<BaseType>,
): T {
  defaultValue ??= 0 as BaseType
  isBaseType ??= isNumber
  out ??= { x: defaultValue, y: defaultValue } as T
  if (arg === undefined || arg === null) {
    return out
  }
  if (isBaseType(arg)) {
    out.x = arg
    out.y = arg
    return out
  }
  if (Array.isArray(arg)) {
    const [x, y] = arg
    out.x = x
    out.y = y
    return out
  }
  if ('width' in (arg as any)) {
    const { width, height } = arg as any
    out.x = width
    out.y = height
    return out
  }
  const { x, y } = arg as T
  out.x = x
  out.y = y
  return out
}

export function toVector2Declaration<BaseType = number>(arg: Vector2Declaration<BaseType>): Vector2Declaration<BaseType> {
  const { x, y } = fromVector2Declaration(arg)
  return [x, y]
}

export function isVector3Declaration<BaseType = number>(arg: any, isBaseType = isNumber<BaseType>): arg is Vector3Declaration<BaseType> {
  return isVector2Declaration(arg, isBaseType)
}

export function fromVector3Declaration<BaseType = number, T extends Vector3Like<BaseType> = Vector3Like<BaseType>>(
  arg: Vector3Declaration<BaseType>,
  out?: T,
  defaultValue?: BaseType,
  isBaseType?: IsBaseType<BaseType>,
): T {
  isBaseType ??= isNumber
  defaultValue ??= 0 as BaseType
  out ??= { x: defaultValue, y: defaultValue, z: defaultValue } as T
  if (arg === undefined || arg === null) {
    return out
  }
  if (isBaseType(arg)) {
    out.x = arg as BaseType
    out.y = arg as BaseType
    out.z = arg as BaseType
    return out
  }
  if (Array.isArray(arg)) {
    const [x, y, z = defaultValue] = arg
    out.x = x
    out.y = y
    out.z = z
    return out
  }
  if ('width' in arg) {
    const { width, height = defaultValue, depth = defaultValue } = arg
    out.x = width
    out.y = height
    out.z = depth
    return out
  }
  const { x = defaultValue, y = defaultValue, z = defaultValue } = arg as T
  out.x = x
  out.y = y
  out.z = z
  return out
}

export function toVector3Declaration<BaseType = number>(arg: Vector3Declaration<BaseType>): Vector3Declaration<BaseType> {
  const { x, y, z } = fromVector3Declaration(arg)
  return [x, y, z]
}

export function isVector4Declaration<BaseType = number>(arg: any, isBaseType = isNumber<BaseType>): arg is Vector4Declaration<BaseType> {
  return (
    isVector2Declaration(arg, isBaseType)
    || (typeof arg === 'object' && isBaseType(arg.x) && isBaseType(arg.y) && isBaseType(arg.z) && isBaseType(arg.w))
  )
}

export function fromVector4Declaration<BaseType = number, T extends Vector4Like<BaseType> = Vector4Like<BaseType>>(
  arg: Vector4Declaration<BaseType>,
  out?: T,
  defaultValue?: BaseType,
  isBaseType?: IsBaseType<BaseType>,
): T {
  isBaseType ??= isNumber
  defaultValue ??= 0 as BaseType
  out ??= { x: defaultValue, y: defaultValue, z: defaultValue, w: defaultValue } as T
  if (arg === undefined || arg === null) {
    return out
  }
  if (isBaseType(arg)) {
    out.x = arg
    out.y = arg
    out.z = arg
    out.w = arg
    return out
  }
  if (Array.isArray(arg)) {
    const [x, y, z = defaultValue, w = defaultValue] = arg
    out.x = x
    out.y = y
    out.z = z
    out.w = w
    return out
  }
  if ('width' in arg) {
    const { width, height = defaultValue, depth = defaultValue, time = defaultValue } = arg
    out.x = width
    out.y = height
    out.z = depth
    out.w = time
    return out
  }
  if ('top' in arg) {
    const { top, right = defaultValue, bottom = defaultValue, left = defaultValue } = arg
    // top, right, bottom, left (CSS order)
    out.x = top
    out.y = right
    out.z = bottom
    out.w = left
    return out
  }
  const { x = defaultValue, y = defaultValue, z = defaultValue, w = defaultValue } = arg as T
  out.x = x
  out.y = y
  out.z = z
  out.w = w
  return out
}

export function toVector4Declaration<BaseType = number>(arg: Vector4Declaration<BaseType>): Vector4Declaration<BaseType> {
  const { x, y, z, w } = fromVector4Declaration(arg)
  return [x, y, z, w]
}
