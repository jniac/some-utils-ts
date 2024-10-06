import { Ray2Like, RectangleLike, Vector2Like } from '../../types'
import { isRectangleLike } from '../../types/is'
import { Padding, PaddingDeclaration } from './padding'
import { Ray2, Ray2Args } from './ray2'

export type RectangleDeclaration =
  | [x: number, y: number, width: number, height: number]
  | [width: number, height: number]
  | Partial<RectangleLike>
  | { aspect: number, diagonal: number }
  | { position?: Vector2Like, extent: number | Vector2Like }
  | { position?: Vector2Like, size: Vector2Like }

export function fromRectangleDeclaration(declaration: RectangleDeclaration, out = new Rectangle()) {
  if (Array.isArray(declaration)) {
    if (declaration.length === 2) {
      const [width, height] = declaration
      return out.set(width, height)
    }
    if (declaration.length === 4) {
      const [x, y, width, height] = declaration
      return out.set(x, y, width, height)
    }
    throw new Error('Oops. Wrong parameters here.')
  }

  if (isRectangleLike(declaration)) {
    return out.copy(declaration)
  }

  if ('aspect' in declaration && 'diagonal' in declaration) {
    const { aspect, diagonal } = declaration
    return out.setDiagonalAndAspect(diagonal, aspect)
  }

  if ('extent' in declaration) {
    const { position: { x: px, y: py } = { x: 0, y: 0 }, extent } = declaration
    if (typeof extent === 'number') {
      return out.set(px - extent, py - extent, extent * 2, extent * 2)
    }
    if (typeof extent === 'object') {
      const { x = 0, y = 0 } = extent
      return out.set(px - x, py - y, x * 2, y * 2)
    }
    throw new Error('Oops. Wrong parameters here.')
  }

  if ('size' in declaration) {
    const { position = { x: 0, y: 0 }, size } = declaration
    return out
      .setPosition(position.x, position.y)
      .setSize(size.x, size.y)
  }

  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
  } = declaration
  out.set(x, y, width, height)

  return out
}

export function union<T extends RectangleLike>(out: T, a: RectangleLike, b: RectangleLike): void {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const right = Math.max(a.x + a.width, b.x + b.width)
  const bottom = Math.max(a.y + a.height, b.y + b.height)

  out.x = x
  out.y = y
  out.width = right - x
  out.height = bottom - y
}

export function innerRectangle<T extends RectangleLike>(
  out: T,
  outerRect: RectangleLike,
  innerAspect: number,
  sizeMode: "contain" | "cover",
  alignX: number,
  alignY: number,
): void {
  let innerWidth = 0
  let innerHeight = 0

  // Determine dimensions based on the chosen sizing strategy
  if (sizeMode === "contain") {
    if (outerRect.width / outerRect.height > innerAspect) {
      // Outer is wider relative to desired aspect
      innerHeight = outerRect.height
      innerWidth = innerHeight * innerAspect
    } else {
      innerWidth = outerRect.width
      innerHeight = innerWidth / innerAspect
    }
  } else if (sizeMode === "cover") {
    if (outerRect.width / outerRect.height < innerAspect) {
      // Outer is narrower relative to desired aspect
      innerHeight = outerRect.height
      innerWidth = innerHeight * innerAspect
    } else {
      innerWidth = outerRect.width
      innerHeight = innerWidth / innerAspect
    }
  }

  // Calculate centering position
  const innerX = outerRect.x + (outerRect.width - innerWidth) * alignX
  const innerY = outerRect.y + (outerRect.height - innerHeight) * alignY

  out.x = innerX
  out.y = innerY
  out.width = innerWidth
  out.height = innerHeight
}

class RectangleCastResult {
  constructor(
    public ray: Ray2Like,
    public intersects: boolean,
    public tmin: number,
    public tmax: number,
  ) { }

  getPoint<T extends Vector2Like>(t: number, out: T = { x: 0, y: 0 } as T): T {
    out.x = this.ray.origin.x + this.ray.direction.x * t
    out.y = this.ray.origin.y + this.ray.direction.y * t
    return out
  }

  getPointMin<T extends Vector2Like>(out: T = { x: 0, y: 0 } as T, {
    offset = 0,
  } = {}): T {
    return this.getPoint(this.tmin + offset, out)
  }

  getPointMax<T extends Vector2Like>(out: T = { x: 0, y: 0 } as T, {
    offset = 0,
  } = {}): T {
    return this.getPoint(this.tmax + offset, out)
  }
}

/**
 * Very versatile and useful class for working with rectangles.
 * 
 * Features:
 * - alignment
 * - aspect ratio
 * - diagonal
 * - area
 * - padding
 * - inner rectangle
 * - relative coordinates
 * - uv coordinates
 * - contains methods
 */
export class Rectangle implements RectangleLike, Iterable<number> {
  static from(source: RectangleDeclaration): Rectangle {
    return fromRectangleDeclaration(source, new Rectangle())
  }

  x: number = 0
  y: number = 0
  width: number = 0
  height: number = 0

  constructor()
  constructor(width: number, height: number)
  constructor(x: number, y: number, width: number, height: number)
  constructor(...args: any) {
    if (args.length > 0) {
      this.set.apply(this, args)
    }
  }

  *[Symbol.iterator](): Generator<number> {
    yield this.x
    yield this.y
    yield this.width
    yield this.height
  }

  copy(other: RectangleLike): this {
    this.x = other.x
    this.y = other.y
    this.width = other.width
    this.height = other.height
    return this
  }

  clone(): Rectangle {
    return new Rectangle().copy(this)
  }

  set(width: number, height: number): this
  set(x: number, y: number, width: number, height: number): this
  set(other: Rectangle): this
  set(...args: any): this {
    if (args.length === 4) {
      this.x = args[0]
      this.y = args[1]
      this.width = args[2]
      this.height = args[3]
      return this
    }
    if (args.length === 2) {
      this.width = args[0]
      this.height = args[1]
      return this
    }
    if (args.length === 1) {
      const [arg] = args
      if (arg instanceof Rectangle) {
        this.copy(arg)
      }
    }
    if (args.length === 0) {
      this.x = 0
      this.y = 0
      this.width = 0
      this.height = 0
      return this
    }
    throw new Error('Oops. Wrong parameters here.')
  }

  fromRelativePoint<T extends Vector2Like>(alignX: number, alignY: number, out?: T): T
  fromRelativePoint<T extends Vector2Like>(align: Vector2Like, out?: T): T
  fromRelativePoint<T extends Vector2Like>(...args: any[]): T {
    if (typeof args[0] === 'object') {
      const [align, out] = args as [Vector2Like, T?]
      return this.fromRelativePoint(align.x, align.y, out)
    }
    if (typeof args[0] === 'number') {
      const [alignX, alignY, out = { x: 0, y: 0 }] = args as [number, number, T?]
      out.x = this.x + this.width * alignX
      out.y = this.y + this.height * alignY
      return out as T
    }
    throw new Error('Oops. Wrong parameters here.')
  }

  toRelativePoint<T extends Vector2Like>(point: Vector2Like, out?: T): T {
    out ??= { x: 0, y: 0 } as T
    out.x = (point.x - this.x) / this.width
    out.y = (point.y - this.y) / this.height
    return out
  }

  getCenterX() {
    return this.x + this.width / 2
  }

  setCenterX(value: number): this {
    this.x = value - this.width / 2
    return this
  }

  getCenterY() {
    return this.y + this.height / 2
  }

  setCenterY(value: number): this {
    this.y = value - this.height / 2
    return this
  }

  getCenter<T extends Vector2Like>(out: T = { x: 0, y: 0 } as T): T {
    out.x = this.getCenterX()
    out.y = this.getCenterY()
    return out
  }

  setCenter(point: Vector2Like): this {
    return (this
      .setCenterX(point.x)
      .setCenterY(point.y))
  }

  getMinX() {
    return this.x
  }

  setMinX(value: number, mode: 'resize' | 'translate' = 'resize'): this {
    switch (mode) {
      case 'resize': {
        if (value > this.left) {
          this.width = 0
          this.x = value
        } else {
          this.width += this.x - value
          this.x = value
        }
        break
      }

      case 'translate': {
        this.x = value
        break
      }
    }
    return this
  }

  getMaxX() {
    return this.x + this.width
  }

  setMaxX(value: number, mode: 'resize' | 'translate' = 'resize'): this {
    switch (mode) {
      case 'resize': {
        if (value < this.x) {
          this.width = 0
          this.x = value
        } else {
          this.width = value - this.x
        }
        break
      }

      case 'translate': {
        this.x = value - this.width
        break
      }
    }
    return this
  }

  getMinY() {
    return this.y
  }

  setMinY(value: number, mode: 'resize' | 'translate' = 'resize'): this {
    switch (mode) {
      case 'resize': {
        if (value > this.y + this.height) {
          this.height = 0
          this.y = value
        } else {
          this.height += this.y - value
          this.y = value
        }
        break
      }

      case 'translate': {
        this.y = value
        break
      }
    }
    return this
  }

  getMaxY() {
    return this.y + this.height
  }

  setMaxY(value: number, mode: 'resize' | 'translate' = 'resize'): this {
    switch (mode) {
      case 'resize': {
        if (value < this.y) {
          this.height = 0
          this.y = value
        } else {
          this.height = value - this.y
        }
        break
      }

      case 'translate': {
        this.y = value - this.height
        break
      }
    }
    return this
  }

  translate(x: number, y: number): this {
    this.x += x
    this.y += y
    return this
  }

  multiplyScalar(scalar: number): this {
    this.x *= scalar
    this.y *= scalar
    this.width *= scalar
    this.height *= scalar
    return this
  }

  multiply(scalarX: number, scalarY: number): this {
    this.x *= scalarX
    this.y *= scalarY
    this.width *= scalarX
    this.height *= scalarY
    return this
  }

  setPosition(x: number, y: number, align?: Vector2Like): this {
    const alignX = align?.x ?? 0
    const alignY = align?.y ?? 0
    this.x = x - this.width * alignX
    this.y = y - this.height * alignY
    return this
  }

  getSize<T extends Vector2Like>(out: T = { x: 0, y: 0 } as T): T {
    out.x = this.width
    out.y = this.height
    return out
  }

  setWidth(width: number, align?: number): this {
    const alignX = align ?? 0
    this.x += (this.width - width) * alignX
    this.width = width
    return this
  }

  setHeight(height: number, align?: number): this {
    const alignY = align ?? 0
    this.y += (this.height - height) * alignY
    this.height = height
    return this
  }

  setSize(width: number, height: number, align?: Vector2Like): this {
    const alignX = align?.x ?? 0
    const alignY = align?.y ?? 0
    this.x += (this.width - width) * alignX
    this.y += (this.height - height) * alignY
    this.width = width
    this.height = height
    return this
  }

  /**
   * Resize the rectangle to fit a given area, keeping the aspect ratio.
   */
  setArea(value: number, align?: Vector2Like): this {
    const scalar = Math.sqrt(value / this.area)
    const width = this.width * scalar
    const height = this.height * scalar
    return this.setSize(width, height, align)
  }

  setDiagonal(value: number, align?: Vector2Like): this {
    const aspect = this.width / this.height
    const height = Math.sqrt(value ** 2 / (1 + aspect ** 2))
    const width = height * aspect
    return this.setSize(width, height, align)
  }

  setAspect(aspect: number, align?: Vector2Like): this {
    const { diagonal } = this
    const height = Math.sqrt(diagonal ** 2 / (1 + aspect ** 2))
    const width = height * aspect
    return this.setSize(width, height, align)
  }

  setDiagonalAndAspect(diagonal: number, aspect: number, align?: Vector2Like): this {
    const height = Math.sqrt(diagonal ** 2 / (1 + aspect ** 2))
    const width = height * aspect
    return this.setSize(width, height, align)
  }

  applyPadding(padding: PaddingDeclaration, mode = <'shrink' | 'grow'>'shrink'): this {
    const { top, right, bottom, left } = Padding.ensure(padding)
    if (mode === 'shrink') {
      this.x += left
      this.y += top
      this.width -= left + right
      this.height -= top + bottom
    } else {
      this.x -= left
      this.y -= top
      this.width += left + right
      this.height += top + bottom
    }
    return this
  }

  /**
   * Less useful method than `invertY()`, but still useful for flipping the x-axis. 
   */
  flipX(): this {
    this.x = -this.x - this.width
    return this
  }

  /**
   * Useful for flipping the y-axis (e.g. canvas / web coordinates vs. screen / gl coordinates)
   */
  flipY(): this {
    this.y = -this.y - this.height
    return this
  }

  union(other: RectangleLike): this {
    union(this, other, this)
    return this
  }

  unionRectangles(a: RectangleLike, b: RectangleLike): this {
    union(this, a, b)
    return this
  }

  innerRectangle({
    aspect = 1,
    sizeMode = 'contain',
    alignX = .5,
    alignY = .5,
    padding = 0,
  }: Partial<{
    aspect: number
    sizeMode: "contain" | "cover"
    alignX: number
    alignY: number
    padding: PaddingDeclaration
  }>,
    out: Rectangle = new Rectangle(),
  ): Rectangle {
    innerRectangle(
      out,
      _rect.copy(this).applyPadding(padding),
      aspect,
      sizeMode,
      alignX,
      alignY)
    return out
  }

  /**
   * Very useful method to calculate, for example, the uv coordinates of a rectangle.
   * 
   * Warning: Mutates self.
   */
  relativeTo(other: RectangleLike): this {
    this.x -= other.x
    this.y -= other.y
    this.x /= other.width
    this.y /= other.height
    this.width /= other.width
    this.height /= other.height
    return this
  }

  lerpRectangles(a: RectangleLike, b: RectangleLike, t: number): this {
    this.x = a.x + (b.x - a.x) * t
    this.y = a.y + (b.y - a.y) * t
    this.width = a.width + (b.width - a.width) * t
    this.height = a.height + (b.height - a.height) * t
    return this
  }

  lerp(other: RectangleLike, t: number): this {
    return this.lerpRectangles(this, other, t)
  }

  containsXY(x: number, y: number): boolean {
    return x >= this.x
      && x < this.x + this.width
      && y >= this.y
      && y < this.y + this.height
  }

  containsPoint(point: Vector2Like): boolean {
    return this.containsXY(point.x, point.y)
  }

  containsRect(other: RectangleLike): boolean {
    return other.x >= this.x
      && other.y >= this.y
      && other.x + other.width <= this.x + this.width
      && other.y + other.height <= this.y + this.height
  }

  /**
   * Readable / declarative method that can be called with different parameters:
   * contains(x, y) -> containsXY(x, y)
   * contains([x, y]) -> containsXY(x, y)
   * contains(point) -> containsPoint(point)
   * contains(rect) -> containsRect(rect)
   */
  contains(x: number, y: number): boolean
  contains(other: Vector2Like): boolean
  contains(other: RectangleLike): boolean
  contains(...args: any[]): boolean {
    if (args.length === 2) {
      const [x, y] = args
      return this.containsXY(x, y)
    }
    if (args.length === 1) {
      const [arg] = args
      if (Array.isArray(arg)) {
        const [x, y] = arg
        return this.containsXY(x, y)
      }
      if (typeof arg === 'object') {
        // Duck typing
        if ('x' in arg && 'y' in arg) {
          // In Three.js, Vector2 has "width" and "height" aliases, so duck typing 
          // is not reliable here. Instead, we check for the constructor name.
          if (/vector2|point/.test(arg.constructor.name)) {
            return this.containsPoint(arg)
          }
          if ('width' in arg && 'height' in arg) {
            return this.containsRect(arg)
          }
          return this.containsPoint(arg)
        }
      }
    }
    throw new Error('Oops. Wrong parameters here.')
  }

  uv<T extends Vector2Like = Vector2Like>({ x, y }: T, out?: T): T {
    out ??= { x: 0, y: 0 } as T
    out.x = (x - this.x) / this.width
    out.y = (y - this.y) / this.height
    return out
  }

  linecast(...ray2Args: Ray2Args): RectangleCastResult {
    const { x, y, width, height } = this
    const ray = Ray2.from(...ray2Args)
    const { ox, oy, dx, dy } = ray
    const t1 = (x - ox) / dx
    const t2 = (x + width - ox) / dx
    const t3 = (y - oy) / dy
    const t4 = (y + height - oy) / dy
    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4))
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4))
    const intersects = tmin <= tmax
    return new RectangleCastResult(ray, intersects, tmin, tmax)
  }

  raycast(...ray2Args: Ray2Args): RectangleCastResult {
    const result = this.linecast(...ray2Args)
    if (result.intersects === false) {
      return result
    }
    let { tmin, tmax } = result
    const intersects = tmax >= 0
    if (intersects === false) {
      return new RectangleCastResult(result.ray, intersects, tmin, tmax)
    }
    tmin = tmin < 0 ? tmax : tmin
    return new RectangleCastResult(result.ray, intersects, tmin, tmax)
  }

  // Sugar:
  get centerX() {
    return this.getCenterX()
  }
  set centerX(value: number) {
    this.setCenterX(value)
  }

  get centerY() {
    return this.getCenterY()
  }
  set centerY(value: number) {
    this.setCenterY(value)
  }

  get center() {
    return this.getCenter()
  }
  set center(point: Vector2Like) {
    this.setCenter(point)
  }

  get minX() {
    return this.getMinX()
  }
  set minX(value: number) {
    this.setMinX(value)
  }

  get maxX() {
    return this.getMaxX()
  }
  set maxX(value: number) {
    this.setMaxX(value)
  }

  get minY() {
    return this.getMinY()
  }
  set minY(value: number) {
    this.setMinY(value)
  }

  get maxY() {
    return this.getMaxY()
  }
  set maxY(value: number) {
    this.setMaxY(value)
  }

  /**
   * Shorthand for `minX`.
   */
  get left() {
    return this.getMinX()
  }
  set left(value: number) {
    this.setMinX(value)
  }

  /**
   * Shorthand for `maxX`.
   */
  get right() {
    return this.getMaxX()
  }
  set right(value: number) {
    this.setMaxX(value)
  }

  /**
   * DOM oriented (y-axis is inverted).
   * 
   * Shorthand for `minY`.
   */
  get top() {
    return this.getMinY()
  }
  set top(value: number) {
    this.setMinY(value)
  }

  /**
   * DOM oriented (y-axis is inverted).
   * 
   * Shorthand for `maxY`.
   */
  get bottom() {
    return this.getMaxY()
  }
  set bottom(value: number) {
    this.setMaxY(value)
  }

  get size() {
    return this.getSize()
  }

  set size(value: Vector2Like) {
    this.setSize(value.x, value.y)
  }

  get area() {
    return this.width * this.height
  }
  set area(value: number) {
    this.setArea(value)
  }

  get diagonal() {
    return Math.sqrt(this.width ** 2 + this.height ** 2)
  }
  set diagonal(value: number) {
    this.setDiagonal(value)
  }

  get aspect() {
    return this.width / this.height
  }
  set aspect(value: number) {
    this.setAspect(value)
  }

  tupple(): [number, number, number, number] {
    return [this.x, this.y, this.width, this.height]
  }
}

const _rect = new Rectangle()

