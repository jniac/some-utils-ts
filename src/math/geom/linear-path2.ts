import { AngleDeclaration, fromAngleDeclaration, fromVector2Declaration, Vector2Declaration } from '../../declaration'
import { Vector2Like } from '../../types'
import { bezier2, cubicBezierArcControlPoints } from './bezier'
import { Line2 } from './line2'

function cloneVector2Like<T extends Vector2Like>(p: T): T {
  const v = new (p.constructor as { new(): T })()
  v.x = p.x
  v.y = p.y
  return v
}

export type Transform2Declaration = number[] | Partial<{
  x: number
  y: number
  translation: Vector2Declaration
  scale: Vector2Declaration
  rotation: AngleDeclaration
}>

function fromTransform2Declaration(value: Transform2Declaration, out = new Float32Array(9), rowMajor = true): Float32Array {
  if (value instanceof Float32Array) {
    if (value.length === 9)
      return value
    throw new Error('Invalid Transform2 declaration')
  }
  if (Array.isArray(value)) {
    if (value.length === 9 && value.every((v) => typeof v === 'number')) {
      return new Float32Array(value)
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

function transform<T extends Vector2Like>(points: T[], matrix3: Float32Array, rowMajor = true) {
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

const _p0: Vector2Like = { x: 0, y: 0 }
const _p1: Vector2Like = { x: 0, y: 0 }
const _line1 = new Line2()
const _line2 = new Line2()

function computeSignedArea(points: Vector2Like[]): number {
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const { x: p0x, y: p0y } = points[i]
    const { x: p1x, y: p1y } = points[(i + 1) % n]
    area += (p1x - p0x) * (p1y + p0y)
  }
  return area / 2
}

/**
 * Computes the winding of a closed path.
 * @param points Points of the closed path.
 * @returns True if the path is clockwise, false if it is counter-clockwise.
 */
function computeClosedPathIsDirect(points: Vector2Like[]): boolean {
  return computeSignedArea(points) > 0
}

function simplify<T extends Vector2Like>(points: T[], closed: boolean, { distanceThresold = 1e-4, angleThreshold = .0001 } = {}): T[] {
  return points
    // Remove duplicate points
    .filter((p, i, points) => {
      const { x: x0, y: y0 } = points[i === 0 ? points.length - 1 : i - 1]
      const { x: x1, y: y1 } = p
      return Math.abs(x1 - x0) > distanceThresold || Math.abs(y1 - y0) > distanceThresold
    })
    // Remove collinear points
    .filter((p, i, points) => {
      const n = points.length
      if (closed === false && (i === 0 || i === n - 1))
        return true

      const p0 = points[(i + n - 1) % n]
      const p1 = points[(i + 1) % n]

      _line1.fromStartEnd(p0, p)
      _line2.fromStartEnd(p, p1)
      const angle = _line1.angleTo(_line2)
      return Math.abs(angle) > angleThreshold
    })
}

function offsetClosedPath<T extends Vector2Like>(points: T[], amount: number): T[] {
  if (points.length < 2)
    return points.map(cloneVector2Like)

  const constructor = points[0].constructor as { new(): T }
  const n = points.length
  const result: T[] = new Array(n)
  for (let i = 0; i < n; i++) {
    const p = new constructor()
    result[i] = p
    const a = points[(i + n - 1) % n]
    const b = points[i]
    const c = points[(i + 1) % n]
    _line1.fromStartEnd(a, b).offset(amount)
    _line2.fromStartEnd(b, c).offset(amount)
    if (_line1.intersection(_line2, { out: p }) === null) { // parallel / collinear
      p.x = _line2.ox
      p.y = _line2.oy
    }
  }
  return result
}

function offsetOpenPath<T extends Vector2Like>(points: T[], amount: number): T[] {
  if (points.length < 2)
    return points.map(cloneVector2Like)

  const constructor = points[0].constructor as { new(): T }
  const n = points.length
  const result: T[] = new Array(n)

  {
    const { x: x0, y: y0 } = points[0]
    const { x: x1, y: y1 } = points[1]
    let dx = x1 - x0
    let dy = y1 - y0
    const l = Math.hypot(dx, dy)
    dx /= l
    dy /= l
    const p = new constructor()
    p.x = x0 + dy * amount
    p.y = y0 - dx * amount
    result[0] = p
  }

  {
    const { x: x0, y: y0 } = points[n - 1]
    const { x: x1, y: y1 } = points[n - 2]
    let dx = x0 - x1 // reversed
    let dy = y0 - y1 // reversed
    const l = Math.hypot(dx, dy)
    dx /= l
    dy /= l
    const p = new constructor()
    p.x = x0 + dy * amount
    p.y = y0 - dx * amount
    result[n - 1] = p
  }

  for (let i = 1; i < n - 1; i++) {
    const p = new constructor()
    result[i] = p
    const a = points[(i + n - 1) % n]
    const b = points[i]
    const c = points[(i + 1) % n]
    _line1.fromStartEnd(a, b).offset(amount)
    _line2.fromStartEnd(b, c).offset(amount)
    if (_line1.intersection(_line2, { out: p }) === null) { // parallel / collinear
      p.x = _line2.ox
      p.y = _line2.oy
    }
  }
  return result
}

const roundCornerOptionsDefaults = {
  /**
   * Tension of the corner curve.
   * 
   * Higher values result in a tighter curve.
   * 
   * - `1` = circular arc
   * - `<1` = looser curve
   * - `>1` = tighter curve
   */
  tension: 1,
  /**
   * Number of segments per quarter circle.
   */
  resolution: 8,
  /**
   * Radius of the rounded corner.
   */
  radius: .1,
}
type RoundCornerOptions = Partial<typeof roundCornerOptionsDefaults>
type RoundCornerDelegate = (info: { point: Vector2Like, angle: number, line1: Line2, line2: Line2 }) => RoundCornerOptions
/**
 * Rounds the corners of a path.
 * 
 * The provided delegate is called for each corner point and should return the 
 * rounding options for that point.
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
    const angle = line1.angleTo(line2)

    const {
      radius,
      tension,
      resolution,
    } = {
      ...roundCornerOptionsDefaults,
      ...delegate({ point: b, angle, line1, line2 }),
    }

    if (Math.abs(angle) < 1e-6) {
      // collinear
      const p = new constructor()
      p.x = b.x
      p.y = b.y
      result.push(p)
      continue
    }

    const offset = angle > 0 ? -radius : radius
    line1.offset(offset)
    line2.offset(offset)

    line1.intersection(line2, { out: p })

    let a1, a2
    if (angle > 0) {
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

    // Compute control points for the cubic Bezier curve
    cubicBezierArcControlPoints(p, radius, a1, a2, tension, cp)

    const arc = a2 - a1
    const count = Math.ceil(Math.abs(arc) / Math.PI * (4 * resolution))
    for (let j = 0; j < count; j++) {
      const t = j / (count - 1)
      result.push(bezier2(cp, t))
    }
  }
  return result
}

type OnError = 'throw' | 'warn' | 'ignore'
function handleError<T>(instance: T, message: string, onError: OnError): T {
  if (onError === 'throw') {
    throw new Error(message)
  } else if (onError === 'warn') {
    console.warn(message)
  }
  return instance
}

/**
 * A linear path is a sequence of points that can be used to represent a path in 2D space.
 * 
 * Note: 
 * - "2" in "LinearPath2" is for 2D (aka "Vector2"), not for version.
 */
export class LinearPath2<T extends Vector2Like = Vector2Like> {
  points: T[]
  closed: boolean

  /**
   * Cache for various computed properties.
   * 
   * Currently used to store whether the path is direct (clockwise) or not.
   * 
   * ## Why cache?
   * Because some operations are cheap when the path is simple (like checking if it's direct),
   * but become expensive after operations like rounding corners (which can add many points,
   * but do not change the overall winding of the path).
   * 
   * @example
   * ```ts
   * const path = new LinearPath2(points).isDirectToCache()
   * console.log(path.cache.isDirect) // true or false
   * // or
   * path.toCache({ foo: 'bar' })
   * console.log(path.cache.foo) // 'bar'
   * ```
   */
  cache: Partial<{ isDirect: boolean, [key: string]: any }> = {}

  constructor(points: T[] = [], closed = true) {
    this.points = points
    this.closed = closed
  }

  from(points: Vector2Declaration[], closed = this.closed, {
    pointType = Object as unknown as { new(): Vector2Like },
  } = {}): this {
    this.points = points.map(p => fromVector2Declaration(p, new pointType()) as T)
    this.closed = closed
    return this
  }

  copy(source: LinearPath2<T>): this {
    this.points = source.points.map(cloneVector2Like)
    this.closed = source.closed
    return this
  }

  clone(): LinearPath2<T> {
    return new LinearPath2<T>().copy(this)
  }

  set(points: T[], closed = this.closed): this {
    this.points = points
    this.closed = closed
    return this
  }

  reverse(): this {
    this.points.reverse()
    if (this.cache.isDirect !== undefined)
      this.cache.isDirect = !this.cache.isDirect
    return this
  }

  isDirect(): boolean {
    return this.closed && computeClosedPathIsDirect(this.points) === false
  }

  toCache(props: LinearPath2['cache']): this {
    Object.assign(this.cache, props)
    return this
  }

  isDirectToCache(): this {
    if (this.closed) {
      this.toCache({ isDirect: computeClosedPathIsDirect(this.points) })
    }
    return this
  }

  makeDirect(value = true): this {
    if (value !== this.isDirect()) {
      this.points.reverse()
    }
    return this
  }

  /**
   * Removes duplicate and collinear points.
   */
  simplify(options?: Parameters<typeof simplify>[2]): this {
    this.points = simplify(this.points, this.closed, options)
    return this
  }

  offset(amount: number): this {
    if (this.closed) {
      this.points = offsetClosedPath(this.points, amount)
    } else {
      this.points = offsetOpenPath(this.points, amount)
    }
    return this
  }

  outline(width: number, { onError = <OnError>'warn' } = {}): this {
    if (this.closed)
      return handleError(this, 'Cannot outline an closed path', onError)
    this.points = [
      ...offsetOpenPath(this.points, width / 2),
      ...offsetOpenPath(this.points, -width / 2).reverse(),
    ]
    this.closed = true
    return this
  }

  extend(amount: number, { onError = <OnError>'warn' } = {}): this {
    if (this.closed)
      return handleError(this, 'Cannot extend a closed path', onError)
    if (this.points.length < 2)
      return handleError(this, 'Cannot extend a path with less than 2 points', onError)
    const n = this.points.length
    const { x: x0, y: y0 } = this.points[0]
    const { x: x1, y: y1 } = this.points[1]
    {
      let dx = x1 - x0
      let dy = y1 - y0
      const l = Math.hypot(dx, dy)
      dx /= l
      dy /= l
      this.points[0].x = x0 - dx * amount
      this.points[0].y = y0 - dy * amount
    }
    {
      const { x: x0, y: y0 } = this.points[n - 1]
      const { x: x1, y: y1 } = this.points[n - 2]
      let dx = x1 - x0 // reversed
      let dy = y1 - y0 // reversed
      const l = Math.hypot(dx, dy)
      dx /= l
      dy /= l
      this.points[n - 1].x = x0 - dx * amount
      this.points[n - 1].y = y0 - dy * amount
    }
    return this
  }

  transform(...values: Transform2Declaration[]): this {
    for (const value of values) {
      transform(this.points, fromTransform2Declaration(value))
    }
    return this
  }

  roundCorner(options: number | RoundCornerDelegate | RoundCornerOptions, { onError = <OnError>'ignore' } = {}): this {
    if (this.points.length < 3)
      return handleError(this, 'Cannot round corners of a path with less than 3 points', onError)
    const delegate =
      typeof options === 'function' ? options :
        typeof options === 'number' ? () => ({ radius: options }) :
          () => options
    this.points = roundCorner(this.points, delegate)
    return this
  }
}