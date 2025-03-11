import { fromVector2Declaration, Vector2Declaration } from '../../declaration'
import { Vector2Like } from '../../types'

enum Line2Side {
  Left = -1,
  On = 0,
  Right = 1,
}

type Line2Like = {
  ox: number
  oy: number
  vx: number
  vy: number
}

function isLine2Like(value: unknown): value is Line2Like {
  return (
    typeof value === 'object' && value !== null
    && 'ox' in value && typeof value.ox === 'number'
    && 'oy' in value && typeof value.oy === 'number'
    && 'vx' in value && typeof value.vx === 'number'
    && 'vy' in value && typeof value.vy === 'number'
  )
}

type PointDeclarationArray =
  | [number, number, number, number]
  | [Vector2Declaration, Vector2Declaration]

type Line2Declaration =
  | Line2Like
  | PointDeclarationArray

function from<T extends Line2>(out: T, value: Line2Declaration): T {
  if (Array.isArray(value)) {
    if (value.length === 2) {
      const [p0, p1] = value
      const { x: ox, y: oy } = fromVector2Declaration(p0)
      const { x: vx, y: vy } = fromVector2Declaration(p1)
      return out.set(ox, oy, vx, vy)
    }
    if (value.length !== 4 || value.every((v) => typeof v !== 'number')) {
      throw new Error('Invalid Line2 declaration')
    }
    const [ox, oy, vx, vy] = value
    return out.set(ox, oy, vx, vy)
  }
  if (isLine2Like(value)) {
    return out.set(value.ox, value.oy, value.vx, value.vy)
  }
  throw new Error('Invalid Line2 declaration')
}

function fromStartEnd<T extends Line2>(out: T, value: PointDeclarationArray): T {
  if (value.length === 4) {
    const [x1, y1, x2, y2] = value
    return out.set(x1, y1, x2 - x1, y2 - y1)
  }
  if (value.length === 2) {
    const [start, end] = value
    const { x: x1, y: y1 } = fromVector2Declaration(start)
    const { x: x2, y: y2 } = fromVector2Declaration(end)
    return out.set(x1, y1, x2 - x1, y2 - y1)
  }
  throw new Error('Invalid Line2 declaration')
}

function ensure(value: unknown) {
  if (value instanceof Line2) {
    return value
  }
  return from(new Line2(), value as Line2Declaration)
}

class Line2 implements Line2Like {
  static from(...args: Parameters<Line2['from']>): Line2 {
    return new Line2().from(...args)
  }

  static ensure = ensure

  ox = 0
  oy = 0
  vx = 1
  vy = 0

  set(ox: number, oy: number, vx: number, vy: number): this {
    this.ox = ox
    this.oy = oy
    this.vx = vx
    this.vy = vy
    return this
  }

  from(...args: [Line2Declaration] | PointDeclarationArray): Line2 {
    return args.length === 1
      ? from(this, args[0])
      : from(this, args)
  }

  fromStartEnd(...args: [PointDeclarationArray] | PointDeclarationArray): Line2 {
    return args.length === 1
      ? fromStartEnd(this, args[0])
      : fromStartEnd(this, args)
  }

  pointAt<T extends Vector2Like>(t: number, {
    out = null as T | null,
  } = {}): T {
    out ??= { x: 0, y: 0 } as T
    const { ox, oy, vx, vy } = this
    out.x = ox + t * vx
    out.y = oy + t * vy
    return out
  }

  p0<T extends Vector2Like>(out: T | null = null): T {
    out ??= { x: 0, y: 0 } as T
    out.x = this.ox
    out.y = this.oy
    return out
  }

  p1<T extends Vector2Like>(out: T | null = null): T {
    out ??= { x: 0, y: 0 } as T
    out.x = this.ox + this.vx
    out.y = this.oy + this.vy
    return out
  }

  vector<T extends Vector2Like>(out: T | null = null): T {
    out ??= { x: 0, y: 0 } as T
    out.x = this.vx
    out.y = this.vy
    return out
  }

  orthogonal<T extends Vector2Like>(out: T | null = null): T {
    out ??= { x: 0, y: 0 } as T
    out.x = -this.vy
    out.y = this.vx
    return out
  }

  computeT(point: Vector2Declaration): number {
    const { ox, oy, vx, vy } = this
    const { x, y } = fromVector2Declaration(point)
    return ((x - ox) * vx + (y - oy) * vy) / (vx * vx + vy * vy)
  }

  project<T extends Vector2Like>(point: Vector2Declaration, {
    out = null as null | T,
  } = {}): T {
    out ??= { x: 0, y: 0 } as T
    const t = this.computeT(point)
    const { ox, oy, vx, vy } = this
    out.x = ox + t * vx
    out.y = oy + t * vy
    return out
  }

  side(point: Vector2Declaration, {
    epsilon = .000001,
  } = {}): Line2Side {
    const { ox, oy, vx, vy } = this
    const { x, y } = fromVector2Declaration(point)
    const cross = (x - ox) * vy - (y - oy) * vx
    return cross < -epsilon ? Line2Side.Left : cross > epsilon ? Line2Side.Right : Line2Side.On
  }

  // Sugar:
  start = this.p0
  end = this.p1
}

export {
  Line2,
  Line2Declaration,
  Line2Like,
  Line2Side
}

