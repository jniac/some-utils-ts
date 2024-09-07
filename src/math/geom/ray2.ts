import { Ray2Like, Vector2Like } from '../../types'

export type Ray2Args =
  | [ox: number, oy: number, dx: number, dy: number]
  | [origin: { x: number, y: number }, direction: { x: number, y: number }]
  | [Partial<Ray2Like>]

export class Ray2 implements Ray2Like {
  static from(...args: Ray2Args): Ray2 {
    return new Ray2(...args)
  }

  ox = 0
  oy = 0
  dx = 1
  dy = 0

  constructor()
  constructor(...args: Ray2Args)
  constructor(...args: Ray2Args) {
    if (args.length > 0) {
      this.set(...args)
    }
  }

  getOrigin<T extends Vector2Like>(out: T = { x: 0, y: 0 } as T): T {
    out.x = this.ox
    out.y = this.oy
    return out
  }

  setOrigin(origin: Vector2Like): this {
    this.ox = origin.x
    this.oy = origin.y
    return this
  }

  getDirection<T extends Vector2Like>(out: T = { x: 0, y: 0 } as T): T {
    out.x = this.dx
    out.y = this.dy
    return out
  }

  setDirection(direction: Vector2Like, { normalize = true } = {}): this {
    let { x, y } = direction
    if (normalize) {
      const length = Math.hypot(x, y)
      if (length === 0) {
        x = 1
        y = 0
      } else {
        x /= length
        y /= length
      }
    }
    this.dx = x
    this.dy = y
    return this
  }

  set(...args: Ray2Args): this {
    if (args.length === 4) {
      const [ox, oy, dx, dy] = args
      return (this
        .setOrigin({ x: ox, y: oy })
        .setDirection({ x: dx, y: dy }))
    }
    if (args.length === 2) {
      return (this
        .setOrigin(args[0])
        .setDirection(args[1]))
    }
    if (args.length === 1) {
      return (this
        .setOrigin(args[0].origin ?? this.origin)
        .setDirection(args[0].direction ?? this.direction))
    }
    throw new Error('Not implemented')
  }

  get origin() {
    return this.getOrigin()
  }

  set origin(origin: Vector2Like) {
    this.setOrigin(origin)
  }

  get direction() {
    return this.getDirection()
  }

  set direction(direction: Vector2Like) {
    this.setDirection(direction)
  }
}
