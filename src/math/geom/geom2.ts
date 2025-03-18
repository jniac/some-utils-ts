import { Vector2Like } from '../../types'

export function dot2(u: Vector2Like, v: Vector2Like): number {
  return u.x * v.x + u.y * v.y
}

export function cross2(u: Vector2Like, v: Vector2Like): number {
  return u.x * v.y - u.y * v.x
}

export function length2(u: Vector2Like): number {
  return Math.hypot(u.x, u.y)
}

export function vectorAngle2(u: Vector2Like, v: Vector2Like): number {
  return Math.atan2(cross2(u, v), dot2(u, v))
}
