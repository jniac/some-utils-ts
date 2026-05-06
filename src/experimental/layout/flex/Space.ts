import { fromVector2Declaration, Vector2Declaration } from '../../../declaration'
import { Rectangle } from '../../../math/geom/rectangle'
import { Vector2Like } from '../../../types'

import { Scalar, ScalarDeclaration, ScalarType } from './Scalar'
import { TreeNode } from './TreeNode'
import { computeLayout4 } from './computeLayout-4'
import { AspectSizeModeDeclaration, Direction, DirectionDeclaration, parseDirection, parsePositioning, Positioning, PositioningDeclaration } from './types'

function isPureXYObject<T>(arg: any): arg is { x: T, y: T } {
  return typeof arg === 'object' && 'x' in arg && 'y' in arg && Object.keys(arg).length === 2
}

export type Declaration2D<T> =
  | T
  | T[]
  | [x: T, y: T]
  | { x: T, y: T }

export type Scalar2Declaration = Declaration2D<ScalarDeclaration>

export function fromDeclaration2D<T>(arg: Declaration2D<T>): [T, T] {
  if (Array.isArray(arg)) {
    const [x, y] = arg
    return [x, y]
  }

  if (isPureXYObject<T>(arg)) {
    return [arg.x, arg.y]
  }

  return [arg, arg]
}

export function fromScalar2Declaration(arg: Scalar2Declaration, outX: Scalar, outY: Scalar): [Scalar, Scalar] {
  const [x, y] = fromDeclaration2D(arg)
  outX.parse(x)
  outY.parse(y)
  return [outX, outY]
}

type BoxSpacingTupleDeclaration = [top: ScalarDeclaration, right: ScalarDeclaration, bottom: ScalarDeclaration, left: ScalarDeclaration]

type BoxSpacingDeclaration =
  | ScalarDeclaration
  | [all: ScalarDeclaration]
  | [vertical: ScalarDeclaration, horizontal: ScalarDeclaration]
  | BoxSpacingTupleDeclaration
  | (string | number)[] // For convenience

function fromBoxSpacingDeclaration(arg: BoxSpacingDeclaration): BoxSpacingTupleDeclaration {
  if (Array.isArray(arg) === false) {
    return [arg, arg, arg, arg]
  } else {
    const array = arg as any[]
    if (array.length === 1) {
      return [array[0], array[0], array[0], array[0]]
    } else if (array.length === 2) {
      return [array[0], array[1], array[0], array[1]]
    } else if (array.length === 4) {
      return array as BoxSpacingTupleDeclaration
    }
  }
  throw new Error('Invalid number of arguments')
}

type SpacingTupleDeclaration = [gap: ScalarDeclaration, ...BoxSpacingTupleDeclaration]

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
  return [gap, ...fromBoxSpacingDeclaration(rest)]
}

export type SpaceProps = Partial<{
  name: string
  enabled: boolean
  direction: DirectionDeclaration
  positioning: PositioningDeclaration
  offset: Scalar2Declaration
  offsetX: ScalarDeclaration
  offsetY: ScalarDeclaration
  size: Declaration2D<ScalarDeclaration | 'fit-content'>
  sizeX: ScalarDeclaration | 'fit-content'
  sizeY: ScalarDeclaration | 'fit-content'
  flowAlign: Vector2Declaration | number[]
  flowAlignX: number
  flowAlignY: number
  align: Vector2Declaration<number | null>
  alignX: number | null
  alignY: number | null
  aspect: null | number
  flowAspectSizeMode: AspectSizeModeDeclaration
  aspectSizeMode: AspectSizeModeDeclaration
  childrenAbsoluteSpacingMode: number
  selfAbsoluteSpacingMode: number | null
  padding: BoxSpacingDeclaration
  paddingTop: ScalarDeclaration
  paddingRight: ScalarDeclaration
  paddingBottom: ScalarDeclaration
  paddingLeft: ScalarDeclaration
  margin: BoxSpacingDeclaration
  marginTop: ScalarDeclaration
  marginRight: ScalarDeclaration
  marginBottom: ScalarDeclaration
  marginLeft: ScalarDeclaration
  gap: ScalarDeclaration
  spacing: SpacingDeclaration
  userData: Record<string, any>

  /** @deprecated Use `align` instead */
  alignSelf: Vector2Declaration<number | null>
  /** @deprecated Use `alignX` and `alignY` instead */
  alignSelfX: number | null
  /** @deprecated Use `alignX` and `alignY` instead */
  alignSelfY: number | null
}>

type SpacePredicate =
  | ((space: Space) => boolean)
  | '*'
  | string
  | RegExp

function parseSpacePredicate(arg: SpacePredicate): (space: Space) => boolean {
  if (arg === '*')
    return () => true

  if (typeof arg === 'string')
    return (space: Space) => space.name === arg

  if (arg instanceof RegExp)
    return (space: Space) => arg.test(space.name)

  return arg
}

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
export class Space extends TreeNode {
  enabled: boolean = true

  name: string = ''

  direction: Direction = Direction.Horizontal
  positioning: Positioning = Positioning.Flow
  /**
   * Aspect ratio (width / height) of the space (constraint).
   */
  aspect: number | null = null

  offsetX = new Scalar(0, ScalarType.Absolute)
  offsetY = new Scalar(0, ScalarType.Absolute)
  sizeX = new Scalar(1, ScalarType.Auto)
  sizeY = new Scalar(1, ScalarType.Auto)

  get sizeXFitContent() { return this.sizeX.type === ScalarType.FitContent }
  get sizeYFitContent() { return this.sizeY.type === ScalarType.FitContent }

  extraSizeX = new Scalar(1, ScalarType.Relative)
  extraSizeY = new Scalar(1, ScalarType.Relative)

  padding: [top: Scalar, right: Scalar, bottom: Scalar, left: Scalar] = [
    new Scalar(0, ScalarType.Absolute),
    new Scalar(0, ScalarType.Absolute),
    new Scalar(0, ScalarType.Absolute),
    new Scalar(0, ScalarType.Absolute),
  ]

  margin: [top: Scalar, right: Scalar, bottom: Scalar, left: Scalar] = [
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
  flowAlignX: number = .5

  /**
   * The vertical alignment of the children spaces:
   * - `0`: top
   * - `1`: bottom
   * 
   * Default is `0.5` (center).
   */
  flowAlignY: number = .5

  alignX: number | null = null
  alignY: number | null = null

  /**
   * The spacing mode for absolute children. 
   * 
   * A number between 0 and 1 that determines how the current spacing (padding) is applied to children.
   * - `0`: no spacing (children are positioned at the edge of the parent space)
   * - `1`: full spacing (children are positioned as if they were in flow (parent padding), but still detached)
   * 
   * Notes:
   * - ⚠️ No interpolation here, what would be the point?
   */
  childrenAbsoluteSpacingMode: number = 0

  /**
   * cf. `absoluteChildrenSpacingMode`, but for the space itself. It determines how the space is affected by its own spacing (padding).
   */
  selfAbsoluteSpacingMode: number | null = null

  rect = new Rectangle()

  userData: Record<string, any> = {}

  /**
   * @deprecated Use `new Space({ direction: Direction.Horizontal })` instead.
   */
  constructor(direction: Direction)
  /**
   * Create a new Space with the given properties.
   */
  constructor(props?: SpaceProps)
  constructor(name: string, props?: SpaceProps)
  constructor(...args: any[]) {
    super()
    if (args.length === 1) {
      const arg0 = args[0]
      if (!!arg0) {
        if (typeof arg0 === 'object') {
          this.set(arg0)
        } else {
          this.direction = arg0
        }
      }
    }

    else if (args.length === 2) {
      this.name = args[0]
      this.set(args[1])
    }
  }

  override equals(other: this): boolean {
    return this.enabled === other.enabled
      // && this.name === other.name // Name is not taken into account for equality check, as it's just an identifier and doesn't affect layout
      && this.direction === other.direction
      && this.positioning === other.positioning
      && this.aspect === other.aspect
      && this.offsetX.equals(other.offsetX)
      && this.offsetY.equals(other.offsetY)
      && this.sizeX.equals(other.sizeX)
      && this.sizeY.equals(other.sizeY)
      && this.sizeXFitContent === other.sizeXFitContent
      && this.sizeYFitContent === other.sizeYFitContent
      && this.extraSizeX.equals(other.extraSizeX)
      && this.extraSizeY.equals(other.extraSizeY)
      && this.padding[0].equals(other.padding[0])
      && this.padding[1].equals(other.padding[1])
      && this.padding[2].equals(other.padding[2])
      && this.padding[3].equals(other.padding[3])
      && this.margin[0].equals(other.margin[0])
      && this.margin[1].equals(other.margin[1])
      && this.margin[2].equals(other.margin[2])
      && this.margin[3].equals(other.margin[3])
      && this.gap.equals(other.gap)
      && this.flowAlignX === other.flowAlignX
      && this.flowAlignY === other.flowAlignY
      && this.alignX === other.alignX
      && this.alignY === other.alignY
      && this.childrenAbsoluteSpacingMode === other.childrenAbsoluteSpacingMode
      && this.selfAbsoluteSpacingMode === other.selfAbsoluteSpacingMode
      && this.rect.equals(other.rect)
  }

  copy(other: Space): this {
    this.enabled = other.enabled
    this.name = other.name
    this.direction = other.direction
    this.positioning = other.positioning
    this.aspect = other.aspect
    this.offsetX.copy(other.offsetX)
    this.offsetY.copy(other.offsetY)
    this.sizeX.copy(other.sizeX)
    this.sizeY.copy(other.sizeY)
    this.extraSizeX.copy(other.extraSizeX)
    this.extraSizeY.copy(other.extraSizeY)
    this.padding[0].copy(other.padding[0])
    this.padding[1].copy(other.padding[1])
    this.padding[2].copy(other.padding[2])
    this.padding[3].copy(other.padding[3])
    this.margin[0].copy(other.margin[0])
    this.margin[1].copy(other.margin[1])
    this.margin[2].copy(other.margin[2])
    this.margin[3].copy(other.margin[3])
    this.gap.copy(other.gap)
    this.flowAlignX = other.flowAlignX
    this.flowAlignY = other.flowAlignY
    this.alignX = other.alignX
    this.alignY = other.alignY
    this.childrenAbsoluteSpacingMode = other.childrenAbsoluteSpacingMode
    this.selfAbsoluteSpacingMode = other.selfAbsoluteSpacingMode
    this.rect.copy(other.rect)
    this.userData = { ...other.userData }
    return this
  }

  override clone(): this {
    return super.clone().copy(this)
  }

  set(props: SpaceProps): this {
    // Deprecated properties:
    if (props.alignSelf !== undefined
      || props.alignSelfX === undefined
      || props.alignSelfY === undefined) {
      // copy props to avoid mutating the original object
      props = { ...props }
      if (props.alignSelf !== undefined && props.align === undefined) {
        props.align = props.alignSelf
      }
      if (props.alignSelfX !== undefined && props.alignX === undefined) {
        props.alignX = props.alignSelfX
      }
      if (props.alignSelfY !== undefined && props.alignY === undefined) {
        props.alignY = props.alignSelfY
      }
    }

    // Regular properties:
    if (props.name !== undefined) {
      this.name = props.name
    }
    if (props.enabled !== undefined) {
      this.enabled = props.enabled
    }
    if (props.direction !== undefined) {
      this.direction = parseDirection(props.direction)
    }
    if (props.positioning !== undefined) {
      this.positioning = parsePositioning(props.positioning)
    }
    if (props.offset !== undefined) {
      fromScalar2Declaration(props.offset, this.offsetX, this.offsetY)
    }
    if (props.offsetX !== undefined) {
      this.offsetX.parse(props.offsetX)
    }
    if (props.offsetY !== undefined) {
      this.offsetY.parse(props.offsetY)
    }

    // Size:
    let { size, sizeX, sizeY } = props
    if (size !== undefined) {
      const [_sizeX, _sizeY] = fromDeclaration2D(size)
      sizeX ??= _sizeX
      sizeY ??= _sizeY
    }
    if (sizeX !== undefined) {
      if (
        sizeX === 'fit-content'
        // @ts-expect-error backward compatibility
        || sizeX === 'fit-children' // backward compatibility
      ) {
        this.sizeX.set(1, ScalarType.FitContent)
      } else {
        this.sizeX.parse(sizeX)
      }
    }
    if (sizeY !== undefined) {
      if (
        sizeY === 'fit-content'
        // @ts-expect-error backward compatibility
        || sizeY === 'fit-children' // backward compatibility
      ) {
        this.sizeY.set(1, ScalarType.FitContent)
      } else {
        this.sizeY.parse(sizeY)
      }
    }

    if (props.aspect !== undefined) {
      this.aspect = props.aspect
    }
    if (props.flowAlign !== undefined) {
      const { x, y } = fromVector2Declaration(props.flowAlign)
      this.flowAlignX = x
      this.flowAlignY = y
    }
    if (props.flowAlignX !== undefined) {
      this.flowAlignX = props.flowAlignX
    }
    if (props.flowAlignY !== undefined) {
      this.flowAlignY = props.flowAlignY
    }
    if (props.align !== undefined) {
      const { x, y } = fromVector2Declaration(props.align)
      this.alignX = x
      this.alignY = y
    }
    if (props.alignX !== undefined) {
      this.alignX = props.alignX
    }
    if (props.alignY !== undefined) {
      this.alignY = props.alignY
    }
    if (props.childrenAbsoluteSpacingMode !== undefined) {
      this.childrenAbsoluteSpacingMode = props.childrenAbsoluteSpacingMode
    }
    if (props.selfAbsoluteSpacingMode !== undefined) {
      this.selfAbsoluteSpacingMode = props.selfAbsoluteSpacingMode
    }
    if (props.padding !== undefined) {
      const [top, right, bottom, left] = fromBoxSpacingDeclaration(props.padding as any)
      this.padding[0].parse(top)
      this.padding[1].parse(right)
      this.padding[2].parse(bottom)
      this.padding[3].parse(left)
    }
    if (props.paddingTop !== undefined) {
      this.padding[0].parse(props.paddingTop)
    }
    if (props.paddingRight !== undefined) {
      this.padding[1].parse(props.paddingRight)
    }
    if (props.paddingBottom !== undefined) {
      this.padding[2].parse(props.paddingBottom)
    }
    if (props.paddingLeft !== undefined) {
      this.padding[3].parse(props.paddingLeft)
    }
    if (props.margin !== undefined) {
      const [top, right, bottom, left] = fromBoxSpacingDeclaration(props.margin as any)
      this.margin[0].parse(top)
      this.margin[1].parse(right)
      this.margin[2].parse(bottom)
      this.margin[3].parse(left)
    }
    if (props.marginTop !== undefined) {
      this.margin[0].parse(props.marginTop)
    }
    if (props.marginRight !== undefined) {
      this.margin[1].parse(props.marginRight)
    }
    if (props.marginBottom !== undefined) {
      this.margin[2].parse(props.marginBottom)
    }
    if (props.marginLeft !== undefined) {
      this.margin[3].parse(props.marginLeft)
    }
    if (props.gap !== undefined) {
      this.gap.parse(props.gap)
    }
    if (props.spacing !== undefined) {
      const [gap, top, right, bottom, left] = fromSpacingDeclaration(props.spacing as any)
      this.gap.parse(gap)
      this.padding[0].parse(top)
      this.padding[1].parse(right)
      this.padding[2].parse(bottom)
      this.padding[3].parse(left)
    }
    if (props.userData !== undefined) {
      Object.assign(this.userData, props.userData)
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

  setSizeX(x: ScalarDeclaration): this {
    this.sizeX.parse(x)
    return this
  }

  /**
   * Alias for `setSizeX`
   */
  setWidth(x: ScalarDeclaration): this {
    return this.setSizeX(x)
  }

  setSizeY(y: ScalarDeclaration): this {
    this.sizeY.parse(y)
    return this
  }

  /**
   * Alias for `setSizeY`
   */
  setHeight(y: ScalarDeclaration): this {
    return this.setSizeY(y)
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
    this.flowAlignX = x
    this.flowAlignY = y
    return this
  }

  setUserData(props: Record<string, any>): this {
    Object.assign(this.userData, props)
    return this
  }

  setPadding(all: BoxSpacingDeclaration): this
  setPadding(all: ScalarDeclaration): this
  setPadding(vertical: ScalarDeclaration, horizontal: ScalarDeclaration): this
  setPadding(top: ScalarDeclaration, right: ScalarDeclaration, bottom: ScalarDeclaration, left: ScalarDeclaration): this
  setPadding(...args: any[]): this {
    if (args.length === 1 && Array.isArray(args[0])) {
      args = args[0]
    }
    const [top, right, bottom, left] = fromBoxSpacingDeclaration(args as any)
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
    return this.parent === null
  }

  isLeaf(): boolean {
    return this.children.length === 0
  }

  isLastChild(): boolean {
    if (!this.parent) {
      return false
    }
    return this.parent.children[this.parent.children.length - 1] === this
  }

  /**
   * @deprecated Use `child(...path)` instead.
   */
  get(...args: any[]): Space | null {
    console.warn('Space.get is deprecated. Use Space.child instead.')
    return this.childAt(...args)
  }

  findSpace(predicate: SpacePredicate, { includeSelf = true } = {}): Space | null {
    predicate = parseSpacePredicate(predicate)
    for (const space of this.allDescendants({ includeSelf })) {
      if (predicate(space)) {
        return space
      }
    }
    return null
  }

  *findSpaceAll(predicate: SpacePredicate, { includeSelf = true } = {}): Generator<Space> {
    predicate = parseSpacePredicate(predicate)
    for (const space of this.allDescendants({ includeSelf })) {
      if (predicate(space)) {
        yield space
      }
    }
  }

  setAll(predicate: SpacePredicate, props: SpaceProps): this {
    for (const space of this.findSpaceAll(predicate)) {
      space.set(props)
    }
    return this
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

  getRoot(): Space {
    let current: Space = this
    while (current.parent) {
      current = current.parent
    }
    return current
  }

  add(...spaces: (Space | SpaceProps)[]): this {
    for (const spaceArg of spaces) {
      const space = spaceArg instanceof Space ? spaceArg : new Space(spaceArg)
      space.removeFromParent()
      space.parent = this
      this.children.push(space as this)
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
    padding: BoxSpacingDeclaration
  }): this
  /**
   * Populate the space with `count` spaces with the given properties for each space.
   * @param count 
   * @param props 
   */
  populate(count: number, props?: SpaceProps): this
  populate(...args: any[]): this {
    if (args.length === 1 && typeof args[0] === 'object') {
      const { count, ...props } = args[0]
      return this.populate(count, props)
    }
    const [count, props] = args as [number, SpaceProps]
    for (let i = 0; i < count; i++) {
      this.add(new Space(props))
    }
    return this
  }

  populateGrid(gridX: number, gridY: number, props?: SpaceProps, rowProps?: SpaceProps): this {
    this.direction = Direction.Vertical
    for (let i = 0; i < gridY; i++) {
      const row = new Space({
        direction: Direction.Horizontal,
        ...rowProps,
      }).addTo(this)
      for (let j = 0; j < gridX; j++) {
        row.add(new Space(props))
      }
    }
    return this
  }

  populateSeparators(
    intermediateSeparator?: SpaceProps | ((previous: Space, next: Space) => SpaceProps),
    {
      firstSeparator,
      lastSeparator,
    }: {
      firstSeparator?: SpaceProps | ((next: Space) => SpaceProps)
      lastSeparator?: SpaceProps | ((previous: Space) => SpaceProps)
    } = {}
  ): this {
    if (this.children.length < 2)
      return this

    const [first, ...rest] = this.children
    let before = first
    if (firstSeparator) {
      const separatorProps = typeof firstSeparator === 'function' ? firstSeparator(first) : firstSeparator
      this.prependChild(new Space(separatorProps))
    }
    for (let i = 0, max = rest.length; i < max; i++) {
      const after = rest[i]
      const separatorProps = typeof intermediateSeparator === 'function' ? intermediateSeparator(before, after) : intermediateSeparator
      this.insertChildAfter(before, new Space(separatorProps))
      before = after
    }
    if (lastSeparator) {
      const separatorProps = typeof lastSeparator === 'function' ? lastSeparator(before) : lastSeparator
      this.add(new Space(separatorProps))
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
  getUvRect(options: { out?: Rectangle, flipY?: boolean }): Rectangle {
    const { out = new Rectangle(), flipY } = options
    out.copy(this.rect).relativeTo(this.getRoot().rect)
    if (flipY) {
      out.y = 1 - out.y - out.height
    }
    return out
  }

  #getTopDownRect_rect: null | Rectangle = null
  /**
   * Top-down coordinate system (y goes downwards).
   * 
   * Note:
   * - The returned rectangle instance is reused for performance. If you need to keep it, clone it.
   */
  getTopDownRect(options: { out?: Rectangle } = {}): Rectangle {
    const {
      out = (this.#getTopDownRect_rect ??= new Rectangle())
    } = options
    const root = this.getRoot()

    if (this === root) {
      out.copy(this.rect)
      out.y = out.y - out.height
    } else {
      out
        .copy(this.rect)
        .relativeTo(root.rect)
        .mirrorY(1)
        .absoluteFrom(root.getTopDownRect())
    }

    return out
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
    // computeLayout1(this)
    // computeLayout2(this)
    // computeLayout3(this)
    computeLayout4(this)
    return this
  }

  computeTreeString({
    spaceToString = () => '',
  }: {
    spaceToString?: (space: Space) => string
  } = {}): string {
    const lines = <string[]>[]
    let total = 0
    for (const space of this.allDescendants({ includeSelf: true })) {
      const indent = space.allAncestors()
        .map(parentItem => {
          return parentItem.parent === null || parentItem.isLastChild() ? '   ' : '│  '
        })
        .toArray()
        .reverse()
        .join('')
      const relation = space.depth() === 0 ? '->' :
        space.isLastChild() === false ? '├─' : '└─'
      const childrenCount = space.children.length > 0 ? `(${space.children.length})` : ''
      const line = `${indent}${relation} S ${childrenCount} ${spaceToString(space)}`
      lines.push(line)
      total++
    }
    lines.unshift(`Tree: (${total} spaces)`)
    const str = lines.join('\n')
    return str
  }

  serializeRects(): ArrayBuffer {
    return this.serializeToBuffer({
      nodeExtraDataByteLength: 4 * 4, // 4 floats for rect (x, y, width, height)
      writeNodeExtraData: (space, dataView, offset) => {
        dataView.setFloat32(offset, space.rect.x, true)
        dataView.setFloat32(offset + 4, space.rect.y, true)
        dataView.setFloat32(offset + 8, space.rect.width, true)
        dataView.setFloat32(offset + 12, space.rect.height, true)
      },
    })
  }

  deserializeRects(buffer: ArrayBuffer): this {
    return this.deserializeFromBuffer(buffer, {
      nodeExtraDataByteLength: 4 * 4, // 4 floats for rect (x, y, width, height)
      readNodeExtraData: (space, dataView, offset) => {
        const x = dataView.getFloat32(offset, true)
        const y = dataView.getFloat32(offset + 4, true)
        const width = dataView.getFloat32(offset + 8, true)
        const height = dataView.getFloat32(offset + 12, true)
        space.rect.set(x, y, width, height)
      },
    })
  }

  static deserializeRectsToNew(buffer: ArrayBuffer): Space {
    return new Space().deserializeRects(buffer)
  }
}
