import { ScalarType } from './Scalar'
import { Space } from './Space'
import { Direction, Positioning } from './types'

import { Rectangle, RectangleDeclaration } from '../../../math/geom/rectangle'

/*
# computeLayout3

Third iteration of the computeLayout function. 

Supports:
- "detached" spaces (positioned outside of the normal flow, like absolute positioning in CSS)
- aspect ratio
- "fit-children" but... ⚠️ only in both directions simultaneously.
*/

const PT = 0
const PR = 1
const PB = 2
const PL = 3

class Node {
  static nextId = 0
  static nextUid = 0

  /**
   * Node UID, unique across multiple layout computations.
   */
  uid = Node.nextUid++
  /**
   * Node ID, unique per layout computation.
   */
  id = Node.nextId++

  /**
   * Whether this node is a horizontal layout node.
   */
  is_h: boolean

  /**
   * Whether this node is detached (not participating in the flow layout of its parent).
   */
  is_detached: boolean

  /**
   * Position x
   */
  px = 0
  /**
   * Position y
   */
  py = 0

  /**
   * Size x
   */
  sx = 0
  /**
   * Size y
   */
  sy = 0

  /**
   * Padding right
   */
  pr = 0
  /**
   * Padding left
   */
  pl = 0
  /**
   * Padding top
   */
  pt = 0
  /**
   * Padding bottom
   */
  pb = 0

  gap = 0

  /**
   * Inner size x
   */
  inner_sx = 0
  /**
   * Inner size y
   */
  inner_sy = 0

  /**
   * Inner tangent free space
   */
  tgt_free = 0

  // tgt_overflow = 0

  space: Space

  parent: Node | null = null
  flowChildren: Node[]
  detachedChildren: Node[]

  /**
   * Whether the space is "fractional" in the parent's tangent direction.
   */
  fractionalInTangentSpace: boolean
  /**
   * Whether the space is "fractional" in the parent's normal direction.
   */
  fractionalInNormalSpace: boolean

  /**
   * Whether this node's size has been computed.
   * 
   * Memo:
   * - Node's traversal cannot be linear if we want to support fitting nodes, aspect ratios, and fractional sizes.
   * - Therefore, we need to keep track of which nodes have had their sizes computed already.
   * - ⚠️ Used to prevent double-computation.
   */
  sizeComputed = false
  /**
   * Whether this node's children's sizes have been computed.
   * 
   * Memo:
   * - Node's traversal cannot be linear if we want to support fitting nodes, aspect ratios, and fractional sizes.
   * - Therefore, we need to keep track of which nodes have had their children's sizes computed already.
   * - ⚠️ Used to prevent double-computation.
   */
  childrenSizesComputed = false

  constructor(space: Space, parent: Node | null = null) {
    this.space = space
    this.parent = parent
    this.is_h = space.direction === Direction.Horizontal
    this.is_detached = space.positioning === Positioning.Detached
    const p_is_h = parent?.is_h ?? true

    this.fractionalInTangentSpace = p_is_h
      ? isFractional(space.sizeX.type, space.sizeXFitContent)
      : isFractional(space.sizeY.type, space.sizeYFitContent)

    this.fractionalInNormalSpace = p_is_h
      ? isFractional(space.sizeY.type, space.sizeYFitContent)
      : isFractional(space.sizeX.type, space.sizeXFitContent)

    this.flowChildren = []
    this.detachedChildren = []
    for (const c of space.children) {
      if (c.enabled) {
        const node = new Node(c, this)
        if (c.positioning === Positioning.Flow) {
          this.flowChildren.push(node)
        } else {
          this.detachedChildren.push(node)
        }
      }
    }
  }

  setSize(sx: number, sy: number) {
    if (this.sizeComputed)
      throw new Error(`Implementation Error: Size already computed for node s${this.id}`)

    this.sx = sx
    this.sy = sy
    this.sizeComputed = true
  }

  /**
   * ⚠️ For debugging purposes only (treeString).
   */
  depth(): number {
    let d = 0
    let p = this.parent
    while (p !== null) {
      d++
      p = p.parent
    }
    return d
  }

  /**
   * ⚠️ For debugging purposes only (treeString).
   */
  isLastChild(): boolean {
    if (this.parent === null)
      return true
    const siblings = this.parent.flowChildren
    return siblings[siblings.length - 1] === this
  }

  /**
   * ⚠️ For debugging purposes only (treeString).
   * 
   * Yields all descendant INCLUDING self.
   */
  *allDescendants(): Generator<Node> {
    yield this
    for (const child of this.flowChildren) {
      yield* child.allDescendants()
    }
  }

  /**
   * ⚠️ For debugging purposes only (treeString()).
   * 
   * Yields all ancestor EXCLUDING self.
   */
  *allAncestors(): Generator<Node> {
    let current = this.parent
    while (current !== null) {
      yield current
      current = current.parent
    }
  }

  toTreeString(): string {
    return treeString(this)
  }

  toString(): string {
    return nodeToString(this)
  }
}

function nodeToString(n: Node): string {
  const f = (n: number) => n.toFixed(2).replace(/\.?0+$/, '')
  const childrenCount = n.flowChildren.length > 0 ? `(${n.flowChildren.length}) ` : ''
  const rect = `r(${f(n.px)}, ${f(n.py)}, ${f(n.sx)}, ${f(n.sy)})`
  const free = `tgt_free(${f(n.tgt_free)})`
  const inner = `inner(${f(n.inner_sx)}, ${f(n.inner_sy)})`
  return `s${n.id} ${childrenCount}${rect} ${free} ${inner}`
}

function treeString(root: Node): string {
  const lines = <string[]>[]
  let total = 0
  for (const n of root.allDescendants()) {
    const indent = n.allAncestors()
      .map(parentItem => {
        return parentItem.parent === null || parentItem.isLastChild() ? '   ' : '│  '
      })
      .toArray()
      .reverse()
      .join('')
    const relation = n.depth() === 0 ? '->' :
      n.isLastChild() === false ? '├─' : '└─'
    const line = `${indent}${relation} ${nodeToString(n)}`
    lines.push(line)
    total++
  }
  lines.unshift(`Tree: (${total})`)
  const str = lines.join('\n')
  return str
}

function isFractional(scalarType: ScalarType, fitChildren: boolean): boolean {
  return scalarType === ScalarType.Fraction
    || (scalarType === ScalarType.Auto && fitChildren === false)
}

/**
 * Yields all nodes in the tree rooted at `n` that have tangent fit enabled,
 * in a bottom-up order (children before parents).
 */
function* iterateTangentFit(n: Node): Generator<Node> {
  for (const c of n.flowChildren) {
    yield* iterateTangentFit(c)
  }
  const tangentFit = n.is_h ? n.space.sizeXFitContent : n.space.sizeYFitContent
  if (tangentFit) {
    yield n
  }
}

function computeSpacings(n: Node) {
  n.pr = n.space.padding[PR].compute(n.sx, n.sy)
  n.pl = n.space.padding[PL].compute(n.sx, n.sy)
  n.pt = n.space.padding[PT].compute(n.sy, n.sx)
  n.pb = n.space.padding[PB].compute(n.sy, n.sx)
  n.inner_sx = n.sx - n.pl - n.pr
  n.inner_sy = n.sy - n.pt - n.pb
  n.gap = n.is_h
    ? n.space.gap.compute(n.sx, n.sy)
    : n.space.gap.compute(n.sy, n.sx)
}

function* regularChildren(n: Node): Generator<Node> {
  for (const c of n.flowChildren) {
    if (c.fractionalInTangentSpace === false) {
      yield c
    }
  }
  for (const c of n.detachedChildren) {
    yield c
  }
}

function* fractionalChildren(n: Node): Generator<Node> {
  for (const c of n.flowChildren) {
    if (c.fractionalInTangentSpace === true) {
      yield c
    }
  }
}

/**
 * Compute the sizes of the children of the given root node.
 * 
 * - ⚠️ The given root node must have its size already computed.
 */
function nonFitSizePass(root: Node) {
  const queue = [root]
  while (queue.length > 0) {
    const n = queue.shift()!

    if (n.childrenSizesComputed)
      continue

    computeSpacings(n)
    const isx = n.inner_sx
    const isy = n.inner_sy

    let tgt_free = n.is_h ? isx : isy

    // HORIZONTAL LAYOUT
    if (n.is_h) {
      // 1. Regular children
      for (const c of regularChildren(n)) {
        if (c.is_detached === false) {
          if (c.sizeComputed === false) {
            const c_sx = c.space.sizeX.compute(isx, isy)
            const c_sy = c.space.sizeY.compute(isy, isx)
            c.setSize(c_sx, c_sy)
          }
          tgt_free -= c.sx // Only "flow" children consume free space
        }

        else {
          if (c.sizeComputed === false) {
            const sm = c.space.detachedSpacingMode ?? n.space.detachedChildrenSpacingMode
            const lsx = n.sx * (1 - sm) + isx * sm
            const lsy = n.sy * (1 - sm) + isy * sm
            const c_sx = c.space.sizeX.compute(lsx, lsy)
            const c_sy = c.space.sizeY.compute(lsy, lsx)
            c.setSize(c_sx, c_sy)
          }
        }
      }
      tgt_free -= n.gap * Math.max(0, n.flowChildren.length - 1)

      // 2. Fractional children
      let total = 0
      for (const c of fractionalChildren(n)) {
        total += c.space.sizeX.value
      }
      const tgt_free_clmp = Math.max(0, tgt_free)
      for (const c of fractionalChildren(n)) {
        const c_sx = tgt_free_clmp * (c.space.sizeX.value / total)
        const c_sy = c.space.aspect !== null
          ? c_sx / c.space.aspect
          : c.space.sizeY.compute(isy, isx)
        c.setSize(c_sx, c_sy)
        tgt_free = 0 // Consumed all free spaces
      }
    }

    // VERTICAL LAYOUT
    else {
      // 1. Regular children
      for (const c of regularChildren(n)) {
        if (c.is_detached === false) {
          if (c.sizeComputed === false) {
            const c_sx = c.space.sizeX.compute(isx, isy)
            const c_sy = c.space.sizeY.compute(isy, isx)
            c.setSize(c_sx, c_sy)
          }
          tgt_free -= c.sy // Only "flow" children consume free space
        }

        else {
          if (c.sizeComputed === false) {
            const sm = c.space.detachedSpacingMode ?? n.space.detachedChildrenSpacingMode
            const lsx = n.sx * (1 - sm) + isx * sm
            const lsy = n.sy * (1 - sm) + isy * sm
            const c_sx = c.space.sizeX.compute(lsx, lsy)
            const c_sy = c.space.sizeY.compute(lsy, lsx)
            c.setSize(c_sx, c_sy)
          }
        }
      }
      tgt_free -= n.gap * Math.max(0, n.flowChildren.length - 1)

      // 2. Fractional children
      let total = 0
      for (const c of fractionalChildren(n)) {
        total += c.space.sizeY.value
      }
      const tgt_free_clmp = Math.max(0, tgt_free)
      for (const c of fractionalChildren(n)) {
        const c_sy = tgt_free_clmp * (c.space.sizeY.value / total)
        const c_sx = c.space.aspect !== null
          ? c_sy * c.space.aspect
          : c.space.sizeX.compute(isx, isy)
        c.setSize(c_sx, c_sy)
        tgt_free = 0 // Consumed all free spaces
      }
    }
    n.tgt_free = tgt_free
    n.childrenSizesComputed = true

    queue.push(...n.flowChildren, ...n.detachedChildren)
  }
}

function fitSizePass(node: Node) {
  for (const c of node.flowChildren) {
    if (c.sizeComputed === false) {
      const sx = c.space.sizeX.compute(0, 0)
      const sy = c.space.sizeY.compute(0, 0)
      c.setSize(sx, sy)
    }
    nonFitSizePass(c)
  }
  computeSpacings(node)
  const { is_h } = node

  // HORIZONTAL LAYOUT
  if (is_h) {
    let total_sx = 0
    let max_sy = 0
    for (const c of node.flowChildren) {
      total_sx += c.sx
      if (c.sy > max_sy)
        max_sy = c.sy
    }
    total_sx += node.gap * Math.max(0, node.flowChildren.length - 1)

    const sx = total_sx + node.pl + node.pr
    const sy = max_sy + node.pt + node.pb
    node.setSize(sx, sy)
    computeSpacings(node)
  }

  // VERTICAL LAYOUT
  else {
    let max_sx = 0
    let total_sy = 0
    for (const c of node.flowChildren) {
      total_sy += c.sy
      if (c.sx > max_sx)
        max_sx = c.sx
    }
    total_sy += node.gap * Math.max(0, node.flowChildren.length - 1)

    const sx = max_sx + node.pl + node.pr
    const sy = total_sy + node.pt + node.pb
    node.setSize(sx, sy)
    computeSpacings(node)
  }

  node.childrenSizesComputed = true
}

function sizePass(root: Node) {
  // First pass for fitting nodes, from leaves to root (bottom-up)
  for (const node of iterateTangentFit(root))
    fitSizePass(node)

  // Final pass for non-fitting nodes that were not covered by the above, from root to leaves (top-down)
  nonFitSizePass(root)
}

function positionPass(root: Node) {
  const queue = [root]
  while (queue.length > 0) {
    const n = queue.shift()!
    let x = n.px + n.pl
    let y = n.py + n.pt

    for (const c of n.flowChildren) {
      const ax = c.space.alignX ?? n.space.alignChildrenX
      const ay = c.space.alignY ?? n.space.alignChildrenX
      const ox = c.space.offsetX.compute(c.sx, c.sy)
      const oy = c.space.offsetY.compute(c.sy, c.sx)
      if (n.is_h) {
        c.px = x + ox + n.tgt_free * ax
        c.py = y + oy + (n.inner_sy - c.sy) * ay
        x += c.sx + n.gap
      } else {
        c.px = x + ox + (n.inner_sx - c.sx) * ax
        c.py = y + oy + n.tgt_free * ay
        y += c.sy + n.gap
      }

      queue.push(c)
    }

    for (const c of n.detachedChildren) {
      const ay = c.space.alignY ?? .5
      const ax = c.space.alignX ?? .5
      const sm = c.space.detachedSpacingMode ?? n.space.detachedChildrenSpacingMode
      const ox = c.space.offsetX.compute(c.sx, c.sy)
      const oy = c.space.offsetY.compute(c.sy, c.sx)
      c.px = ox + n.px + n.pl * sm + (n.sx - (n.pl + n.pr) * sm - c.sx) * ax
      c.py = oy + n.py + n.pt * sm + (n.sy - (n.pl + n.pr) * sm - c.sy) * ay
      queue.push(c)
    }
  }
}

function applyLayout(root: Node) {
  const queue = [root]
  while (queue.length > 0) {
    const n = queue.shift()!
    n.space.rect.set(n.px, n.py, n.sx, n.sy)
    queue.push(...n.flowChildren, ...n.detachedChildren)
  }
}

/**
 * Compute the layout from a given node.
 * 
 * Note: 
 * - The given root node may not be the actual root of the tree. This allows to
 *   compute layouts for subtrees (partial updates).
 * - If `rootRect` is given, the root node's position and size are defined by it,
 *   otherwise they are computed from the root node's space properties (interpreted
 *   as absolute values).
 * 
 * @param rootSpace 
 * @param rootRect 
 * @returns 
 */
export function computeLayout3(rootSpace: Space, rootRect?: RectangleDeclaration) {
  Node.nextId = 0

  const root = new Node(rootSpace)

  if (rootRect) {
    const { x, y, width, height } = Rectangle.from(rootRect)
    root.px = x
    root.py = y
    root.sx = width
    root.sy = height
  } else {
    root.px = rootSpace.offsetX.value
    root.py = rootSpace.offsetY.value
    root.sx = root.space.sizeX.compute(0, 0)
    root.sy = root.space.sizeY.compute(0, 0)
  }
  computeSpacings(root)

  /**
   * SIZE PASS
   * After this pass:
   * - node.sx, node.sy are final
   * - childrenSizesComputed === true for all nodes
   */
  sizePass(root)

  /**
   * POSITION PASS
   * After this pass:
   * - node.px, node.py are final
   * - that's it
   */
  positionPass(root)

  applyLayout(root)

  // console.log(treeString(root))

  return root
}