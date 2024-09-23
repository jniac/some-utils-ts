import { Rectangle } from '../../../math/geom/rectangle'
import { Point2Like } from '../../../types'

import { Direction, DirectionDeclaration, parseDirection } from './Direction'
import { Scalar, ScalarDeclaration, ScalarType } from './Scalar'
import { computeChildrenRect, computeRootRect } from './Space.layout'

type PaddingDeclaration =
  | ScalarDeclaration
  | [all: ScalarDeclaration]
  | [vertical: ScalarDeclaration, horizontal: ScalarDeclaration]
  | [top: ScalarDeclaration, right: ScalarDeclaration, bottom: ScalarDeclaration, left: ScalarDeclaration]

function fromPaddingDeclaration(arg: PaddingDeclaration) {
  if (Array.isArray(arg) === false) {
    return [arg, arg, arg, arg]
  } else {
    const array = arg as any[]
    if (array.length === 1) {
      return [array[0], array[0], array[0], array[0]]
    } else if (array.length === 2) {
      return [array[0], array[1], array[0], array[1]]
    } else if (array.length === 4) {
      return array
    }
  }
  throw new Error('Invalid number of arguments')
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
 * // Creates 3 spaces into the first vertical space, with 1prt, 2prt and 3prt height
 * // where prt is a special unit that means "part" of the remaining space
 * for (let i = 0; i < 3; i++) {
 *   root.getChild(0)!
 *     .add(new Space().setSize(`1rel`, `${i + 1}prt`).setSpacing(10))
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
  direction: Direction

  root: Space
  parent: Space | null = null
  children: Space[] = []

  offsetX = new Scalar(0, ScalarType.Absolute)
  offsetY = new Scalar(0, ScalarType.Absolute)
  sizeX = new Scalar(1, ScalarType.Fraction)
  sizeY = new Scalar(1, ScalarType.Fraction)

  extraSizeX = new Scalar(1, ScalarType.Relative)
  extraSizeY = new Scalar(1, ScalarType.Relative)

  padding: [top: Scalar, right: Scalar, bottom: Scalar, left: Scalar] = [
    new Scalar(0, ScalarType.Absolute),
    new Scalar(0, ScalarType.Absolute),
    new Scalar(0, ScalarType.Absolute),
    new Scalar(0, ScalarType.Absolute),
  ]

  gap: Scalar = new Scalar(0, ScalarType.Absolute)

  alignX: number = .5
  alignY: number = .5

  rect = new Rectangle()

  userData: Record<string, any> = {}

  constructor(direction: Direction = Direction.Horizontal) {
    this.direction = direction
    this.root = this
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

  *allDescendants({ includeSelf = true } = {}): Generator<Space> {
    if (includeSelf) {
      yield this
    }
    for (const child of this.children) {
      yield* child.allDescendants({ includeSelf: true })
    }
  }

  descendantsCount({ includeSelf = true } = {}): number {
    let count = 0
    for (const _ of this.allDescendants({ includeSelf })) {
      count++
    }
    return count
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

  get(...indexes: number[]): Space | null {
    let current: Space = this
    for (let index of indexes) {
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

  pointCast(point: Point2Like): Space | null
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

  populate({
    count = 3,
    size = <ScalarDeclaration>'1prt',
    sizeX = <ScalarDeclaration>size,
    sizeY = <ScalarDeclaration>size,
    spacing = <ScalarDeclaration>0,
    gap = <ScalarDeclaration>spacing,
    padding = <PaddingDeclaration>0,
  } = {}): this {
    for (let i = 0; i < count; i++) {
      this.add(new Space()
        .setSize(sizeX, sizeY)
        .setPadding(padding)
        .setSpacing(gap))
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

  setDirection(direction: DirectionDeclaration): this {
    this.direction = parseDirection(direction)
    return this
  }

  setOffset(x: ScalarDeclaration, y: ScalarDeclaration): this {
    this.offsetX.parse(x)
    this.offsetY.parse(y)
    return this
  }

  setSize(x: ScalarDeclaration, y: ScalarDeclaration = x): this {
    this.sizeX.parse(x)
    this.sizeY.parse(y)
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

  // Utils:
  getUvRect(): Rectangle {
    return this.rect.clone().relativeTo(this.root.rect)
  }
}
