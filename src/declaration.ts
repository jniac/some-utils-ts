import { formatNumber } from './string/number'
import { Vector2Like, Vector3Like, Vector4Like } from './types'

/**
 * Because readonly types are compatible with their mutable counterparts, we can use this type to handle both cases.
 */
type ReadonlyOrNot<T> = T | Readonly<T>

type Vector2DeclarationBase =
  | number
  | [x: number, y: number]
  | { x: number; y: number }
  | { width: number; height: number }

export type Vector2Declaration = ReadonlyOrNot<Vector2DeclarationBase>

type Vector3DeclarationBase =
  | number
  | [x: number, y: number, z?: number]
  | { x: number; y: number; z?: number }
  | { width: number; height: number; depth: number }

export type Vector3Declaration = ReadonlyOrNot<Vector3DeclarationBase>

type Vector4DeclarationBase =
  | number
  | [x: number, y: number, z?: number, w?: number]
  | { x: number; y: number; z?: number, w?: number }
  | { width: number; height: number; depth?: number; time?: number }
  | { top: number; right: number; bottom: number; left: number }

export type Vector4Declaration = ReadonlyOrNot<Vector4DeclarationBase>

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

export function toAngleDeclarationString(value: number, unit: AngleUnit = 'rad', { maxDigits }: { maxDigits?: number } = {}): string & AngleDeclaration {
  maxDigits ??= {
    rad: 3,
    deg: 1,
    turn: 4,
  }[unit]
  return `${formatNumber(value / angleScalars[unit], { maxDigits })}${unit}` as any
}

export function isVector2Declaration(arg: any): arg is Vector2Declaration {
  if (typeof arg === 'number') return true
  if (Array.isArray(arg)) return arg.length >= 2 && arg.length <= 3 && arg.every(v => typeof v === 'number')
  if (typeof arg === 'object') {
    if ('x' in arg && 'y' in arg) return true
    if ('width' in arg && 'height' in arg) return true
  }
  return false
}

export function fromVector2Declaration<T extends Vector2Like = Vector2Like>(arg: Vector2Declaration, out?: T): T {
  out ??= { x: 0, y: 0 } as T
  if (arg === undefined || arg === null) {
    out.x = 0
    out.y = 0
    return out
  }
  if (typeof arg === 'number') {
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
  if ('width' in arg) {
    const { width, height } = arg
    out.x = width
    out.y = height
    return out
  }
  const { x, y } = arg as { x: number; y: number }
  out.x = x
  out.y = y
  return out
}

export function toVector2Declaration(arg: Vector2Declaration): Vector2Declaration {
  const { x, y } = fromVector2Declaration(arg)
  return [x, y]
}

export function isVector3Declaration(arg: any): arg is Vector3Declaration {
  if (typeof arg === 'number') return true
  if (Array.isArray(arg)) return arg.length >= 2 && arg.length <= 3 && arg.every(v => typeof v === 'number')
  if (typeof arg === 'object') {
    if ('x' in arg && 'y' in arg) return true
    if ('width' in arg && 'height' in arg) return true
  }
  return false
}

export function fromVector3Declaration<T extends Vector3Like = Vector3Like>(arg: Vector3Declaration, out?: T): T {
  out ??= { x: 0, y: 0, z: 0 } as T
  if (arg === undefined || arg === null) {
    return out
  }
  if (typeof arg === 'number') {
    out.x = arg
    out.y = arg
    out.z = arg
    return out
  }
  if (Array.isArray(arg)) {
    const [x, y, z = 0] = arg
    out.x = x
    out.y = y
    out.z = z
    return out
  }
  if ('width' in arg) {
    const { width, height = 0, depth = 0 } = arg
    out.x = width
    out.y = height
    out.z = depth
    return out
  }
  const { x = 0, y = 0, z = 0 } = arg as { x: number; y: number; z?: number }
  out.x = x
  out.y = y
  out.z = z
  return out
}

export function toVector3Declaration(arg: Vector3Declaration): Vector3Declaration {
  const { x, y, z } = fromVector3Declaration(arg)
  return [x, y, z]
}

export function isVector4Declaration(arg: any): arg is Vector4Declaration {
  if (typeof arg === 'number') return true
  if (Array.isArray(arg)) return arg.length >= 2 && arg.length <= 4 && arg.every(v => typeof v === 'number')
  if (typeof arg === 'object') {
    if ('x' in arg && 'y' in arg) return true
    if ('width' in arg && 'height' in arg) return true
  }
  return false
}

export function fromVector4Declaration<T extends Vector4Like = Vector4Like>(arg: Vector4Declaration, out?: T): T {
  out ??= { x: 0, y: 0, z: 0, w: 0 } as T
  if (arg === undefined || arg === null) {
    return out
  }
  if (typeof arg === 'number') {
    out.x = arg
    out.y = arg
    out.z = arg
    out.w = arg
    return out
  }
  if (Array.isArray(arg)) {
    const [x, y, z = 0, w = 0] = arg
    out.x = x
    out.y = y
    out.z = z
    out.w = w
    return out
  }
  if ('width' in arg) {
    const { width, height = 0, depth = 0, time = 0 } = arg
    out.x = width
    out.y = height
    out.z = depth
    out.w = time
    return out
  }
  if ('top' in arg) {
    const { top, right = 0, bottom = 0, left = 0 } = arg
    // top, right, bottom, left (CSS order)
    out.x = top
    out.y = right
    out.z = bottom
    out.w = left
    return out
  }
  const { x = 0, y = 0, z = 0, w = 0 } = arg as { x: number; y: number; z?: number; w?: number }
  out.x = x
  out.y = y
  out.z = z
  out.w = w
  return out
}

export function toVector4Declaration(arg: Vector4Declaration): Vector4Declaration {
  const { x, y, z, w } = fromVector4Declaration(arg)
  return [x, y, z, w]
}


