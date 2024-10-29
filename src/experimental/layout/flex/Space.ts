import { fromVector2Declaration, Vector2Declaration } from '../../../declaration'
import { Rectangle } from '../../../math/geom/rectangle'
import { Vector2Like } from '../../../types'

import { Scalar, ScalarDeclaration, ScalarType } from './Scalar'
import { computeChildrenRect, computeRootRect } from './Space.layout'
import { Direction, DirectionDeclaration, parseDirection, parsePositioning, Positioning, PositioningDeclaration } from './types'

export type Scalar2Declaration =
  | ScalarDeclaration
  | [x: ScalarDeclaration, y: ScalarDeclaration]
  | { x: ScalarDeclaration, y: ScalarDeclaration }

export function fromScalar2Declaration(arg: Scalar2Declaration, outX: Scalar, outY: Scalar): [Scalar, Scalar] {
  if (Array.isArray(arg)) {
    const [x, y] = arg
    outX.parse(x)
    outY.parse(y)
    return [outX, outY]
  }

  if (typeof arg === 'object') {
    outX.parse(arg.x)
    outY.parse(arg.y)
    return [outX, outY]
  }

  outX.parse(arg)
  outY.parse(arg)
  return [outX, outY]
}

type PaddingTupleDeclaration = [top: ScalarDeclaration, right: ScalarDeclaration, bottom: ScalarDeclaration, left: ScalarDeclaration]

type PaddingDeclaration =
  | ScalarDeclaration
  | [all: ScalarDeclaration]
  | [vertical: ScalarDeclaration, horizontal: ScalarDeclaration]
  | PaddingTupleDeclaration

function fromPaddingDeclaration(arg: PaddingDeclaration): PaddingTupleDeclaration {
  if (Array.isArray(arg) === false) {
    return [arg, arg, arg, arg]
  } else {
    const array = arg as any[]
    if (array.length === 1) {
      return [array[0], array[0], array[0], array[0]]
    } else if (array.length === 2) {
      return [array[0], array[1], array[0], array[1]]
    } else if (array.length === 4) {
      return array as PaddingTupleDeclaration
    }
  }
  throw new Error('Invalid number of arguments')
}

type SpacingTupleDeclaration = [gap: ScalarDeclaration, ...PaddingTupleDeclaration]

type SpacingDeclaration =
  | ScalarDeclaration
  | [gap: ScalarDeclaration, padding: ScalarDeclaration]
  | [gap: ScalarDeclaration, vertical: ScalarDeclaration, horizontal: ScalarDeclaration]
  | SpacingTupleDeclaration

function fromSpacingDeclaration(arg: SpacingDeclaration): SpacingTupleDeclaration {
  if (Array.isArray(arg) === false) {
    return [arg, arg, arg, arg, arg]
  }

  const [gap, ...rest] = arg
  return [gap, ...fromPaddingDeclaration(rest)]
}

type SetProps = Partial<{
  direction: DirectionDeclaration
  positioning: PositioningDeclaration
  offset: Scalar2Declaration
  offsetX: ScalarDeclaration
  offsetY: ScalarDeclaration
  size: Scalar2Declaration
  sizeX: ScalarDeclaration
  sizeY: ScalarDeclaration
  align: Vector2Declaration
  alignX: ScalarDeclaration
  alignY: ScalarDeclaration
  padding: PaddingDeclaration
  paddingTop: ScalarDeclaration
  paddingRight: ScalarDeclaration
  paddingBottom: ScalarDeclaration
  paddingLeft: ScalarDeclaration
  gap: ScalarDeclaration
  spacing: SpacingDeclaration
}>

/**
 * `some-utilz/layout/flex` is a naive yet robust flex layout system.
 * 
 * It does NOT implement the [official W3C specs](https://www.w3.org/TR/css-flexbox-1/).
 * 
 * It's intended to be used in creative coding projects where you need to create
 * complex layouts with relative and absolute sizes, paddings and gaps.
 * 
 * ## Features:
 * - Horizontal and vertical directions
 * - Absolute and relative sizes
 *   - Absolute: fixed size in pixels
 *   - Relative: size based on the parent size
 *   - Special relative sizes that take the two parent sizes into account: opposite, smaller, larger
 * - Padding and gaps
 * - Part unit for relative sizes
 * - Layout computation (from root to children)
 * - Tree structure
 *   - add
 *   - remove
 *   - get (with index path)
 *   - find (with predicate)
 * - Declarative syntax for sizes, paddings and gaps
 * 
 * ## Exclusive features:
 * - Extra size (extraSizeX, extraSizeY)  
 *   It's motion design friendly feature. You can animate the size of a space 
 *   based on its current size. It's useful for creating animations where a space
 *   could grow or shrink. The whole layout will be affected by this change 
 *   accordingly to the space's direction and alignment.
 *   This extra computed size is added after the regular size computation, so it
 *   will not affect the size of the "part" spaces (only their position).
 * 
 * ## Roadmap:
 * - Min and max sizes
 * - Shrinking options?
 * 
 * Naive implementation of a flex layout system. Naive but robust. Useful for 
 * creating simple layouts with relative and absolute sizes, paddings and gaps 
 * that could be easily computed, animated and rendered.
 * 
 * ## Usage:
 * ```js
 * const root = new Space(Direction.Horizontal)
 *   .setOffset(100, 100)
 *   .setSize(600, 400)
 *   .setPadding(10)
 *   .setGap(10)
 * 
 * // Creates 2 vertical spaces with 25% width and 100% height
 * root.add(new Space(Direction.Vertical).setSize('.25rel', '1rel').setSpacing(10).setUserData({ color: '#f00' }))
 * root.add(new Space(Direction.Vertical).setSize('.25rel', '1rel').setSpacing(10).setUserData({ color: '#f00' }))
 * root.add(new Space(Direction.Vertical).setSize('.25rel', '1rel').setSpacing(10).setUserData({ color: '#f00' }))
 * 
 * // Creates 3 spaces into the first vertical space, with 1fr, 2fr and 3fr height
 * // where fr is a special unit that means "part" of the remaining space
 * for (let i = 0; i < 3; i++) {
 *   root.getChild(0)!
 *     .add(new Space().setSize(`1rel`, `${i + 1}fr`).setSpacing(10))
 * }
 * 
 * const ctx = canvas.getContext('2d')!
 * for (const space of root.allDescendants()) {
 *   ctx.strokeStyle = space.userData.color ?? '#fff'
 *   ctx.strokeRect(space.layoutRect.x, space.layoutRect.y, space.layoutRect.width, space.layoutRect.height)
 * }
 * ```
 */
export class Space {
  enabled: boolean = true
  direction: Direction = Direction.Horizontal
  positioning: Positioning = Positioning.Flow

  root: Space = this
  parent: Space | null = null
  children: Space[] = []

  offsetX = new Scalar(0, ScalarType.Absolute)
  offsetY = new Scalar(0, ScalarType.Absolute)
  sizeX = new Scalar(1, ScalarType.Share)
  sizeY = new Scalar(1, ScalarType.Share)

  extraSizeX = new Scalar(1, ScalarType.Relative)
  extraSizeY = new Scalar(1, ScalarType.Relative)

  padding: [top: Scalar, right: Scalar, bottom: Scalar, left: Scalar] = [
    new Scalar(0, ScalarType.Absolute),
    new Scalar(0, ScalarType.Absolute),
    new Scalar(0, ScalarType.Absolute),
    new Scalar(0, ScalarType.Absolute),
  ]

  gap: Scalar = new Scalar(0, ScalarType.Absolute)

  /**
   * The horizontal alignment of the children spaces:
   * - `0`: left
   * - `1`: right
   * 
   * Default is `0.5` (center).
   */
  alignX: number = .5

  /**
   * The vertical alignment of the children spaces:
   * - `0`: top
   * - `1`: bottom
   * 
   * Default is `0.5` (center).
   */
  alignY: number = .5

  rect = new Rectangle()

  userData: Record<string, any> = {}

  /**
   * @deprecated Use `new Space({ direction: Direction.Horizontal })` instead.
   */
  constructor(direction: Direction)
  /**
   * Create a new Space with the given properties.
   */
  constructor(props?: SetProps)
  constructor(arg?: Direction | SetProps) {
    if (arg) {
      if (typeof arg === 'object') {
        this.set(arg)
      } else {
        this.direction = arg
      }
      this.root = this
    }
  }

  set(props: SetProps): this {
    if (props.direction) {
      this.direction = parseDirection(props.direction)
    }
    if (props.positioning) {
      this.positioning = parsePositioning(props.positioning)
    }
    if (props.offset) {
      fromScalar2Declaration(props.offset, this.offsetX, this.offsetY)
    }
    if (props.offsetX) {
      this.offsetX.parse(props.offsetX)
    }
    if (props.offsetY) {
      this.offsetY.parse(props.offsetY)
    }
    if (props.size) {
      fromScalar2Declaration(props.size, this.sizeX, this.sizeY)
    }
    if (props.sizeX) {
      this.sizeX.parse(props.sizeX)
    }
    if (props.sizeY) {
      this.sizeY.parse(props.sizeY)
    }
    if (props.align) {
      const { x, y } = fromVector2Declaration(props.align)
      this.alignX = x
      this.alignY = y
    }
    if (props.padding) {
      const [top, right, bottom, left] = fromPaddingDeclaration(props.padding as any)
      this.padding[0].parse(top)
      this.padding[1].parse(right)
      this.padding[2].parse(bottom)
      this.padding[3].parse(left)
    }
    if (props.gap) {
      this.gap.parse(props.gap)
    }
    if (props.spacing) {
      const [gap, top, right, bottom, left] = fromSpacingDeclaration(props.spacing as any)
      this.gap.parse(gap)
      this.padding[0].parse(top)
      this.padding[1].parse(right)
      this.padding[2].parse(bottom)
      this.padding[3].parse(left)
    }
    return this
  }

  setDirection(direction: DirectionDeclaration): this {
    this.direction = parseDirection(direction)
    return this
  }

  setPositioning(positioning: PositioningDeclaration): this {
    this.positioning = parsePositioning(positioning)
    return this
  }

  setOffset(x: ScalarDeclaration, y?: ScalarDeclaration): this
  setOffset(value: { x: ScalarDeclaration, y: ScalarDeclaration }): this
  setOffset(...args: any): this {
    if (args[0] && typeof args[0] === 'object') {
      const { x, y = x } = args[0]
      this.offsetX.parse(x)
      this.offsetY.parse(y)
    } else {
      const [x, y = x] = args
      this.offsetX.parse(x)
      this.offsetY.parse(y)
    }
    return this
  }

  setSize(x: ScalarDeclaration, y?: ScalarDeclaration): this
  setSize(value: { x: ScalarDeclaration, y: ScalarDeclaration }): this
  setSize(...args: any): this {
    if (args[0] && typeof args[0] === 'object') {
      const { x, y = x } = args[0]
      this.sizeX.parse(x)
      this.sizeY.parse(y)
    } else {
      const [x, y = x] = args
      this.sizeX.parse(x)
      this.sizeY.parse(y)
    }
    return this
  }

  /**
   * Set the size of the space as an absolute rectangle. Useful for setting the 
   * size of the root space.
   */
  setOffsetSizeAsAbsoluteRect(rect: Rectangle): this {
    this.offsetX.set(rect.x, ScalarType.Absolute)
    this.offsetY.set(rect.y, ScalarType.Absolute)
    this.sizeX.set(rect.width, ScalarType.Absolute)
    this.sizeY.set(rect.height, ScalarType.Absolute)
    return this
  }

  setAlign(x: number, y: number = x): this {
    this.alignX = x
    this.alignY = y
    return this
  }

  setUserData(props: Record<string, any>): this {
    Object.assign(this.userData, props)
    return this
  }

  setPadding(all: PaddingDeclaration): this
  setPadding(all: ScalarDeclaration): this
  setPadding(vertical: ScalarDeclaration, horizontal: ScalarDeclaration): this
  setPadding(top: ScalarDeclaration, right: ScalarDeclaration, bottom: ScalarDeclaration, left: ScalarDeclaration): this
  setPadding(...args: any[]): this {
    if (args.length === 1 && Array.isArray(args[0])) {
      args = args[0]
    }
    const [top, right, bottom, left] = fromPaddingDeclaration(args as any)
    this.padding[0].parse(top)
    this.padding[1].parse(right)
    this.padding[2].parse(bottom)
    this.padding[3].parse(left)
    return this
  }

  setGap(value: ScalarDeclaration): this {
    this.gap.parse(value)
    return this
  }

  setSpacing(all: ScalarDeclaration): this
  setSpacing(gap: ScalarDeclaration, padding: ScalarDeclaration): this
  setSpacing(gap: ScalarDeclaration, vertical: ScalarDeclaration, horizontal: ScalarDeclaration): this
  setSpacing(gap: ScalarDeclaration, top: ScalarDeclaration, right: ScalarDeclaration, bottom: ScalarDeclaration, left: ScalarDeclaration): this
  setSpacing(...args: any[]): this {
    const [gap, ...padding] = args
    this.setGap(gap)
    if (padding.length > 0) {
      this.setPadding.apply(this, padding as any)
    } else {
      this.setPadding(gap)
    }
    return this
  }

  isRoot(): boolean {
    return this.root === this
  }

  isLeaf(): boolean {
    return this.children.length === 0
  }

  depth(): number {
    let depth = 0
    let current: Space | null = this
    while (current) {
      current = current.parent
      depth++
    }
    return depth
  }

  *allDescendants({ includeSelf = false } = {}): Generator<Space> {
    if (includeSelf) {
      yield this
    }
    for (const child of this.children) {
      yield* child.allDescendants({ includeSelf: true })
    }
  }

  descendantsCount({ includeSelf = false } = {}): number {
    let count = 0
    for (const _ of this.allDescendants({ includeSelf })) {
      count++
    }
    return count
  }

  *allAncestors({ includeSelf = false } = {}): Generator<Space> {
    let current: Space | null = includeSelf ? this : this.parent
    while (current) {
      yield current
      current = current.parent
    }
  }

  *allLeaves({ includeSelf = true } = {}): Generator<Space> {
    for (const space of this.allDescendants({ includeSelf })) {
      if (space.children.length === 0) {
        yield space
      }
    }
  }

  leavesCount({ includeSelf = true } = {}): number {
    let count = 0
    for (const _ of this.allLeaves({ includeSelf })) {
      count++
    }
    return count
  }

  path(): number[] {
    const path: number[] = []
    let current: Space = this
    while (current.parent) {
      path.push(current.parent.children.indexOf(current))
      current = current.parent
    }
    return path.reverse()
  }

  /**
   * Return the space at the given path.
   * 
   * Negative indexes are allowed.
   */
  get(...path: number[]): Space | null
  get(path: Iterable<number>): Space | null
  get(...args: any[]): Space | null {
    const path = (args[0] && typeof args[0] === 'object' && Symbol.iterator in args[0]) ? args[0] : args
    let current: Space = this
    for (let index of path) {
      if (index < 0) {
        index = current.children.length + index
      }
      current = current.children[index]
      if (!current) {
        return null
      }
    }
    return current
  }

  find(predicate: (space: Space) => boolean, { includeSelf = true } = {}): Space | null {
    for (const space of this.allDescendants({ includeSelf })) {
      if (predicate(space)) {
        return space
      }
    }
    return null
  }

  *findAll(predicate: (space: Space) => boolean, { includeSelf = true } = {}): Generator<Space> {
    for (const space of this.allDescendants({ includeSelf })) {
      if (predicate(space)) {
        yield space
      }
    }
  }

  pointCast(point: Vector2Like): Space | null
  pointCast(x: number, y: number): Space | null
  pointCast(...args: any[]): Space | null {
    const [x, y] = args.length === 1 ? [args[0].x, args[0].y] : args
    for (const space of this.allLeaves()) {
      if (space.rect.containsXY(x, y)) {
        return space
      }
    }
    return null
  }

  add(...spaces: Space[]): this {
    for (const space of spaces) {
      space.removeFromParent()
      space.parent = this
      space.root = this.root
      this.children.push(space)
    }
    return this
  }

  /**
   * @deprecated Use `populate(count, props)` instead.
   */
  populate(props?: {
    count: number
    size: ScalarDeclaration
    sizeX: ScalarDeclaration
    sizeY: ScalarDeclaration
    spacing: ScalarDeclaration
    gap: ScalarDeclaration
    padding: PaddingDeclaration
  }): this
  /**
   * Populate the space with `count` spaces with the given properties for each space.
   * @param count 
   * @param props 
   */
  populate(count: number, props?: SetProps): this
  populate(...args: any[]): this {
    if (args.length === 1 && typeof args[0] === 'object') {
      const { count, ...props } = args[0]
      return this.populate(count, props)
    }
    const [count, props] = args
    for (let i = 0; i < count; i++) {
      this.add(new Space(props))
    }
    return this
  }

  addTo(space: Space): this {
    space.add(this)
    return this
  }

  prepend(...space: Space[]): this {
    for (const s of space) {
      s.removeFromParent()
      this.children.unshift(s)
      s.parent = this
      s.root = this.root
    }
    return this
  }

  prependTo(space: Space): this {
    space.prepend(this)
    return this
  }

  removeFromParent(): this {
    if (this.parent) {
      this.parent.children.splice(this.parent.children.indexOf(this), 1)
      this.parent = null
      this.root = this
    }
    return this
  }

  remove(...spaces: Space[]): this {
    for (const space of spaces) {
      if (space.parent === this) {
        space.removeFromParent()
      }
    }
    return this
  }

  sort(predicate: (a: Space, b: Space) => number): this {
    this.children.sort(predicate)
    return this
  }

  /**
   * Return the size of the space in the direction of the parent space.
   * 
   * "tangent" means the direction of the parent space (horizontal -> sizeX, vertical -> sizeY).
   */
  tangentSize(): Scalar {
    const direction = this.parent?.direction ?? this.direction
    return direction === Direction.Horizontal ? this.sizeX : this.sizeY
  }

  /**
   * Return the size of the space in the direction of the children spaces.
   * 
   * "normal" means the direction of the children spaces (horizontal -> sizeX, vertical -> sizeY).
   */
  normalSize(): Scalar {
    const direction = this.direction
    return direction === Direction.Horizontal ? this.sizeX : this.sizeY
  }

  // Utils:
  getUvRect(): Rectangle {
    return this.rect.clone().relativeTo(this.root.rect)
  }

  parse(str: string) {
    if (!str) {
      return
    }

    // Define the regular expression pattern
    const pattern = /(\w+)(?:\(([^)]+)\))?/g
    const matches = [] as { token: string, args: string[] }[]

    // Iterate over all matches
    let match
    while ((match = pattern.exec(str)) !== null) {
      const token = match[1]
      const args = match[2] ? match[2].split(',').map(arg => arg.trim()) : []
      matches.push({ token, args })
    }

    for (const { token, args } of matches) {
      switch (token) {
        case 'horizontal': {
          this.direction = Direction.Horizontal
          break
        }
        case 'vertical': {
          this.direction = Direction.Vertical
          break
        }
        case 'size': {
          const [width, height = width] = args
          this.sizeX.parse(width)
          this.sizeY.parse(height)
          break
        }
        default: {
          console.log(str, matches)
          throw new Error(`Unknow type: "${token}"`)
        }
      }
    }
  }

  /**
   * Compute the layout of the space and its children. Should be called on the root space.
   */
  computeLayout(): this {
    if (this.isRoot()) {
      computeRootRect(this)
    }

    const queue: Space[] = [this]
    while (queue.length > 0) {
      const current = queue.shift()!
      computeChildrenRect(current)
      queue.push(...current.children)
    }

    return this
  }
}
