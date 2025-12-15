import { ScalarType } from './Scalar'
import { Space } from './Space'
import { Direction } from './types'

const PT = 0
const PR = 1
const PB = 2
const PL = 3

const AUTO_OR_FRACTION = ScalarType.Auto | ScalarType.Fraction

/**
 * Internal state used during layout computation.
 * 
 * It's essentially a wrapper around Space that caches computed values and provides
 * helper methods for the layout algorithm for tree traversal.
 */
class LayoutNodeSpace {
  static next_id = 0

  id: number
  space: Space
  parent: LayoutNodeSpace | null
  children: LayoutNodeSpace[]

  x?: number
  y?: number
  sx?: number
  sy?: number
  pt?: number
  pr?: number
  pb?: number
  pl?: number
  gap?: number

  sx_avail?: number
  sy_avail?: number

  constructor(space: Space, parent: LayoutNodeSpace | null = null) {
    this.id = LayoutNodeSpace.next_id++
    this.space = space
    this.parent = parent
    this.children = space.children.map(child => new LayoutNodeSpace(child, this))
  }

  *depthFirst_sizeXFitChildren(): Generator<LayoutNodeSpace> {
    for (const child of this.children) {
      yield* child.depthFirst_sizeXFitChildren()
    }
    if (this.space.sizeXFitChildren)
      yield this
  }

  *depthFirst_sizeYFitChildren(): Generator<LayoutNodeSpace> {
    for (const child of this.children) {
      yield* child.depthFirst_sizeYFitChildren()
    }
    if (this.space.sizeYFitChildren)
      yield this
  }

  *allChildren_fractionSizeX(yieldsFraction: boolean): Generator<LayoutNodeSpace> {
    for (const sc of this.children) {
      const is_fr = (sc.space.sizeX.type & AUTO_OR_FRACTION) !== 0 && sc.space.sizeXFitChildren === false
      if (is_fr === yieldsFraction) {
        yield sc
      }
    }
  }

  *allChildren_fractionSizeY(yieldsFraction: boolean): Generator<LayoutNodeSpace> {
    for (const sc of this.children) {
      const is_fr = (sc.space.sizeY.type & AUTO_OR_FRACTION) !== 0 && sc.space.sizeYFitChildren === false
      if (is_fr === yieldsFraction) {
        yield sc
      }
    }
  }

  /**
   * ⚠️ For debugging purposes only (treeString).
   */
  depth(): number {
    let depth = 0
    let current = this.parent
    while (current !== null) {
      depth++
      current = current.parent
    }
    return depth
  }

  /**
   * ⚠️ For debugging purposes only (treeString).
   */
  isLastChild(): boolean {
    if (this.parent === null)
      return true
    const siblings = this.parent.children
    return siblings[siblings.length - 1] === this
  }

  /**
   * ⚠️ For debugging purposes only (treeString).
   * 
   * Yields all descendant INCLUDING self.
   */
  *allDescendants(): Generator<LayoutNodeSpace> {
    yield this
    for (const child of this.children) {
      yield* child.allDescendants()
    }
  }

  /**
   * ⚠️ For debugging purposes only (treeString()).
   * 
   * Yields all ancestor EXCLUDING self.
   */
  *allAncestors(): Generator<LayoutNodeSpace> {
    let current = this.parent
    while (current !== null) {
      yield current
      current = current.parent
    }
  }

  applyToSpace() {
    this.space.rect.set(
      this.x!,
      this.y!,
      this.sx!,
      this.sy!,
    )
    for (const child of this.children) {
      child.applyToSpace()
    }
  }

  set_avail(sx_avail: number, sy_avail: number) {
    this.sx_avail = sx_avail
    this.sy_avail = sy_avail
  }

  req_x(p_sx: number, p_sy: number) {
    return this.x ??=
      this.space.offsetX.compute(p_sx, p_sy)
  }

  req_y(p_sx: number, p_sy: number) {
    return this.y ??=
      this.space.offsetY.compute(p_sy, p_sx)
  }

  req_sx(p_sx: number, p_sy: number) {
    return this.sx ??=
      this.space.sizeX.compute(p_sx, p_sy)
  }

  req_sy(p_sx: number, p_sy: number) {
    return this.sy ??=
      this.space.sizeY.compute(p_sy, p_sx)
  }

  /**
   * Requires all padding values.
   */
  req_p(p_sx: number, p_sy: number): void {
    this.req_pl(p_sx, p_sy)
    this.req_pr(p_sx, p_sy)
    this.req_pt(p_sx, p_sy)
    this.req_pb(p_sx, p_sy)
  }

  req_pl(p_sx: number, p_sy: number): number {
    return this.pl ??=
      this.space.padding[PL].compute(p_sx, p_sy)
  }

  req_pr(p_sx: number, p_sy: number): number {
    return this.pr ??=
      this.space.padding[PR].compute(p_sx, p_sy)
  }

  req_pt(p_sx: number, p_sy: number): number {
    return this.pt ??=
      this.space.padding[PT].compute(p_sy, p_sx)
  }

  req_pb(p_sx: number, p_sy: number): number {
    return this.pb ??=
      this.space.padding[PB].compute(p_sy, p_sx)
  }

  req_gap(is_h: boolean, p_sx: number, p_sy: number): number {
    return this.gap ??= (is_h
      ? this.space.gap.compute(p_sx, p_sy)
      : this.space.gap.compute(p_sy, p_sx))
  }

  treeString(): string {
    const lines = <string[]>[]
    let total = 0
    for (const s of this.allDescendants()) {
      const indent = s.allAncestors()
        .map(parentItem => {
          return parentItem.parent === null || parentItem.isLastChild() ? '   ' : '│  '
        })
        .toArray()
        .reverse()
        .join('')
      const relation = s.depth() === 0 ? '->' :
        s.isLastChild() === false ? '├─' : '└─'
      const childrenCount = s.children.length > 0 ? `(${s.children.length}) ` : ''
      const r = `r(${s.x ?? '?'}, ${s.y ?? '?'}, ${s.sx ?? '?'}, ${s.sy ?? '?'})`
      const avail = `a(${s.sx_avail ?? '?'}, ${s.sy_avail ?? '?'})`
      const line = `${indent}${relation} s${s.id} ${childrenCount}${r} ${avail}`
      lines.push(line)
      total++
    }
    lines.unshift(`Tree: (${total})`)
    const str = lines.join('\n')
    return str
  }
}

/**
  
  SIZING "REGULAR" CHILDREN:

  We inspect the children of each SState in a breadth - first manner,
  computing their sizes based on available space.

  - "Regular": here we are only concerned by "regular" children: "fit" children
    must have been already processed.

  - All is about:
    - 1. Compute non fractional space sizes, and deduce available space
    - 2. Compute fractional total weight
    - 3. Distribute available spaces to fractional space.

  Notes:
  - Available space can be negative (overflow).
  - But fractional space are only concerned by "positive" space. So we have to clamp
    space to zero for fractionnal children BUT keep negative space into the node
    for further alignment concerns.

 */
export function sizingRegularChildren(root: LayoutNodeSpace) {
  const queue = [root]
  while (queue.length > 0) {
    const s = queue.shift()!
    const sx = s.sx!
    const sy = s.sy!
    s.req_p(sx, sy) // Ensure padding is computed

    const is_h = s.space.direction === Direction.Horizontal
    s.req_gap(is_h, sx, sy)

    const sx_inner = sx - s.pl! - s.pr!
    const sy_inner = sy - s.pt! - s.pb!

    let sx_avail = sx_inner
    let sy_avail = sy_inner

    if (is_h) {
      // Non-fractional sizing pass
      for (const sc of s.allChildren_fractionSizeX(false)) {
        sx_avail -= sc.req_sx(sx_inner, sy_inner)
        sy_avail = Math.min(sy_avail, sy_inner - sc.req_sy(sx_inner, sy_inner))
      }

      sx_avail -= s.gap! * Math.max(0, s.children.length - 1)

      // Fractional sizing pass
      let total_fr = 0
      for (const sc of s.allChildren_fractionSizeX(true)) {
        const fr = sc.space.sizeX.value
        total_fr += fr
      }

      const sx_availClamp = Math.max(0, sx_avail)
      for (const sc of s.allChildren_fractionSizeX(true)) {
        const fr = sc.space.sizeX.value
        sc.sx = (fr / total_fr) * sx_availClamp
        sc.req_sy(sx_inner, sy_inner)
        sx_avail = 0 // Consumed
      }

      s.set_avail(sx_avail, sy_avail)
    }

    else {
      // Non-fractional sizing pass
      for (const sc of s.allChildren_fractionSizeY(false)) {
        sx_avail = Math.min(sx_avail, sx_inner - sc.req_sx(sx_inner, sy_inner))
        sy_avail -= sc.req_sy(sx_inner, sy_inner)
      }

      sy_avail -= s.gap! * Math.max(0, s.children.length - 1)

      // Fractional sizing pass
      let total_fr = 0
      for (const sc of s.allChildren_fractionSizeY(true)) {
        const fr = sc.space.sizeY.value
        total_fr += fr
      }

      const sy_availClamp = Math.max(0, sy_avail)
      for (const sc of s.allChildren_fractionSizeY(true)) {
        const fr = sc.space.sizeY.value
        sc.sy = (fr / total_fr) * sy_availClamp
        sc.req_sx(sx_inner, sy_inner)
        sy_avail = 0 // Consumed
      }

      s.set_avail(sx_avail, sy_avail)
    }

    queue.push(...s.children)
  }
}

function positioningAllChildren(root: LayoutNodeSpace) {
  const queue = [root]
  while (queue.length > 0) {
    const s = queue.shift()!
    const x = s.x!
    const y = s.y!
    const sx = s.sx!
    const sy = s.sy!
    const space = s.space
    const is_h = space.direction === Direction.Horizontal
    let offsetX = x + s.pl!
    let offsetY = y + s.pt!
    const ax = space.alignChildrenX
    const ay = space.alignChildrenY
    for (const sc of s.children) {
      sc.x = offsetX
      sc.y = offsetY
      const sc_sx = sc.req_sx(sx, sy)
      const sc_sy = sc.req_sy(sx, sy)
      queue.push(sc)
      const c_ax = sc.space.alignSelfX
      const c_ay = sc.space.alignSelfY
      if (is_h) {
        offsetX += sc_sx + s.gap!
        const sy_avail = sy - s.pt! - s.pb! - sc_sy // Available space in Y for alignment must be computed per-child
        sc.y += sy_avail * (c_ay ?? ay)
        sc.x += s.sx_avail! * (c_ax ?? ax)
      } else {
        offsetY += sc_sy + s.gap!
        const sx_avail = sx - s.pl! - s.pr! - sc_sx // Available space in X for alignment must be computed per-child
        sc.x += sx_avail * (c_ax ?? ax)
        sc.y += s.sy_avail! * (c_ay ?? ay)
      }
    }
  }
}

export function computeLayout2(rootSpace: Space) {
  LayoutNodeSpace.next_id = 0
  const root = new LayoutNodeSpace(rootSpace)

  for (const s of root.depthFirst_sizeXFitChildren()) {
    s.req_gap(true, 0, 0) // direction doesn't matter here
    s.req_pl(0, 0)
    s.req_pr(0, 0)
    let sx = 0
    const is_h = s.space.direction === Direction.Horizontal
    if (is_h) {
      for (const s_c of s.children) {
        sx += s_c.req_sx(0, 0)
      }
      sx += s.gap! * Math.max(0, s.children.length - 1)
    } else {
      for (const s_c of s.children) {
        sx = Math.max(sx, s_c.req_sx(0, 0))
      }
    }
    sx += s.pl! + s.pr!
    s.sx = sx
    s.set_avail(0, 0)
  }

  for (const s of root.depthFirst_sizeYFitChildren()) {
    s.req_gap(true, 0, 0) // direction doesn't matter here
    s.req_pt(0, 0)
    s.req_pb(0, 0)
    let sy = 0
    const is_h = s.space.direction === Direction.Horizontal
    if (is_h === false) {
      for (const s_c of s.children) {
        sy += s_c.req_sy(0, 0)
      }
      sy += s.gap! * Math.max(0, s.children.length - 1)
    } else {
      for (const s_c of s.children) {
        sy = Math.max(sy, s_c.req_sy(0, 0))
      }
    }
    sy += s.pt! + s.pb!
    s.sy = sy
    s.set_avail(0, 0)
  }

  root.req_x(0, 0)
  root.req_y(0, 0)
  root.req_p(0, 0)

  {
    // If the root size is not "fit-children", we need to set its size.
    const sx = root.space.sizeX.value
    const sy = root.space.sizeY.value
    root.req_sx(sx, sy)
    root.req_sy(sx, sy)
  }

  sizingRegularChildren(root)

  positioningAllChildren(root)

  root.applyToSpace()
}

