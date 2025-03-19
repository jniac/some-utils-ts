import { AngleDeclaration, fromAngleDeclaration, fromVector2Declaration, Vector2Declaration } from '../../declaration'
import { Vector2Like } from '../../types'
import { bezier2, cubicBezierArcControlPoints } from './bezier'
import { Line2 } from './line2'

export type Transform2Declaration = number[] | Partial<{
  x: number
  y: number
  translation: Vector2Declaration
  scale: Vector2Declaration
  rotation: AngleDeclaration
}>

function fromTransform2Declaration(value: Transform2Declaration, out = [0, 0, 0, 0, 0, 0, 0, 0, 0], rowMajor = true): number[] {
  if (Array.isArray(value)) {
    if (value.length === 9 && value.every((v) => typeof v === 'number')) {
      return value
    }
    throw new Error('Invalid Transform2 declaration')
  }
  const {
    x = 0,
    y = 0,
    translation = { x, y },
    scale = { x: 1, y: 1 },
    rotation = 0,
  } = value
  const a = fromAngleDeclaration(rotation)
  const c = Math.cos(a)
  const s = Math.sin(a)
  const { x: tx, y: ty } = fromVector2Declaration(translation)
  const { x: sx, y: sy } = fromVector2Declaration(scale)
  if (rowMajor) {
    out[0] = c * sx
    out[3] = -s * sy
    out[6] = tx
    out[1] = s * sx
    out[4] = c * sy
    out[7] = ty
    out[2] = 0
    out[5] = 0
    out[8] = 1
  } else {
    out[0] = c * sx
    out[1] = -s * sy
    out[2] = tx
    out[3] = s * sx
    out[4] = c * sy
    out[5] = ty
    out[6] = 0
    out[7] = 0
    out[8] = 1
  }
  return out
}

function transform<T extends Vector2Like>(points: T[], matrix3: number[], rowMajor = true) {
  for (const p of points) {
    const x = p.x
    const y = p.y
    if (rowMajor) {
      p.x = matrix3[0] * x + matrix3[3] * y + matrix3[6]
      p.y = matrix3[1] * x + matrix3[4] * y + matrix3[7]
    } else {
      p.x = matrix3[0] * x + matrix3[1] * y + matrix3[2]
      p.y = matrix3[3] * x + matrix3[4] * y + matrix3[5]
    }
  }
}

function offset<T extends Vector2Like>(points: T[], amount: number): T[] {
  const constructor = points[0].constructor as { new(): T }
  const result: T[] = []
  const n = points.length
  const line1 = new Line2()
  const line2 = new Line2()
  for (let i = 0; i < n; i++) {
    const p = new constructor()
    result.push(p)

    const a = points[(i + n - 1) % n]
    const b = points[i]
    const c = points[(i + 1) % n]
    line1.fromStartEnd(a, b).offset(amount)
    line2.fromStartEnd(b, c).offset(amount)
    if (line1.intersection(line2, { out: p }) === null) {
      // parallel / collinear
      p.x = line2.ox
      p.y = line2.oy
    }
  }
  return result
}

const roundCornerOptionsDefaults = {
  tension: 1,
  resolution: 32,
  radius: .1,
}
type RoundCornerOptions = Partial<typeof roundCornerOptionsDefaults>
type RoundCornerDelegate = (info: { point: Vector2Like, cross: number, line1: Line2, line2: Line2 }) => RoundCornerOptions
/**
 * 
 * @param points Points of the polygon
 * @param radius 
 * @param tension 
 * @param resolution The number of segments for Math.PI arc.
 * @returns 
 */
function roundCorner<T extends Vector2Like>(points: T[], delegate: RoundCornerDelegate): T[] {
  const constructor = points[0].constructor as { new(): T }
  const result: T[] = []
  const n = points.length
  const line1 = new Line2()
  const line2 = new Line2()
  const p = new constructor()
  const cp = [new constructor(), new constructor(), new constructor(), new constructor()]
  for (let i = 0; i < n; i++) {
    const a = points[(i + n - 1) % n]
    const b = points[i]
    const c = points[(i + 1) % n]
    line1.fromStartEnd(a, b)
    line2.fromStartEnd(b, c)
    const cross = line1.cross(line2)

    const {
      radius,
      tension,
      resolution,
    } = {
      ...roundCornerOptionsDefaults,
      ...delegate({ point: b, cross, line1, line2 }),
    }

    if (Math.abs(cross) < 1e-6) {
      // collinear
      const p = new constructor()
      p.x = b.x
      p.y = b.y
      result.push(p)
      continue
    }

    const offset = cross > 0 ? -radius : radius
    line1.offset(offset)
    line2.offset(offset)

    line1.intersection(line2, { out: p })

    let a1, a2
    if (cross > 0) {
      a1 = line1.angle() - Math.PI / 2
      a2 = line2.angle() - Math.PI / 2
    } else {
      a1 = line1.angle() + Math.PI / 2
      a2 = line2.angle() + Math.PI / 2
    }
    if (Math.abs(a1 - a2) > Math.PI) {
      if (a1 < a2) {
        a1 += Math.PI * 2
      } else {
        a2 += Math.PI * 2
      }
    }

    const arc = a2 - a1
    const count = Math.ceil(Math.abs(arc) / Math.PI * resolution)
    cubicBezierArcControlPoints(p, radius, a1, a2, tension, cp)

    for (let j = 0; j < count; j++) {
      const t = j / (count - 1)
      result.push(bezier2(cp, t))
    }
  }
  return result
}

export class LinearPath2<T extends Vector2Like = Vector2Like> {
  points: T[]

  constructor(points: T[] = []) {
    this.points = points
  }

  from(points: Vector2Declaration[], {
    pointType = Object as unknown as { new(): Vector2Like },
  } = {}): this {
    this.points = points.map(p => fromVector2Declaration(p, new pointType()) as T)
    return this
  }

  copy(source: LinearPath2<T>): this {
    this.points = source.points.map(p => ({ ...p }))
    return this
  }

  clone(): LinearPath2<T> {
    return new LinearPath2(this.points.map(p => ({ ...p })))
  }

  set(points: T[]): this {
    this.points = points
    return this
  }

  clean({ threshold = 1e-4 } = {}): this {
    this.points = this.points
      // Remove duplicate points
      .filter((p, i, points) => {
        const { x: x0, y: y0 } = points[i === 0 ? points.length - 1 : i - 1]
        const { x: x1, y: y1 } = p

        return Math.abs(x1 - x0) > threshold || Math.abs(y1 - y0) > threshold
      })
      // Remove collinear points
      .filter((p, i, points) => {
        if (i === 0 || i === points.length - 1)
          return true

        const { x: x0, y: y0 } = points[i - 1]
        const { x: x1, y: y1 } = p
        const { x: x2, y: y2 } = points[i + 1]

        const dx1 = x1 - x0
        const dy1 = y1 - y0
        const dx2 = x2 - x1
        const dy2 = y2 - y1

        return Math.abs(dx1 * dy2 - dx2 * dy1) > threshold
      })
    return this
  }

  offset(amount: number): this {
    this.points = offset(this.points, amount)
    return this
  }

  transform(...values: Transform2Declaration[]): this {
    for (const value of values) {
      transform(this.points, fromTransform2Declaration(value))
    }
    return this
  }

  roundCorner(options: number | RoundCornerDelegate | RoundCornerOptions): this {
    const delegate =
      typeof options === 'function' ? options :
        typeof options === 'number' ? () => ({ radius: options }) :
          () => options
    this.points = roundCorner(this.points, delegate)
    return this
  }
}