import { Rectangle, RectangleDeclaration } from '../../../math/geom/rectangle'
import { Kolor as K } from '../../../string/kolor'
import { Scalar, ScalarType } from './Scalar'
import { Space } from './Space'
import { TreeNode } from './TreeNode'
import { Direction, Positioning } from './types'

// Padding order: top, right, bottom, left (Clockwise from top, same as CSS).
const P_NY = 0 // top padding
const P_PX = 1 // right padding
const P_PY = 2 // bottom padding
const P_NX = 3 // left padding

let warningCode = 0
const Warnings: Record<string, [code: number, message: string]> = {
  RelativeToParentButNoParent: [
    warningCode++,
    'Property is relative to parent but node has no parent.',
  ],
  RelativeToFitContent: [
    warningCode++,
    'Value cannot be relative to self to a size that is fit-content.',
  ],
  CircularDependency: [
    warningCode++,
    'Circular dependency detected. The involved properties have been resolved to 0.',
  ],
}

class InternalError extends Error { }

enum PropertyType {
  Gap,
  PaddingNY,
  PaddingPY,
  PaddingNX,
  PaddingPX,
  SizeX,
  SizeY,
  InnerSizeX,
  InnerSizeY,
}

enum PropertyAlgorithmStatus {
  /**
   * 
   */
  Unset,
  /**
   * The value cannot be computed from other properties only.
   * Should be resolved from the fractional pass.
   */
  Fraction,
  /**
   * The value is absolute and does not depend on any other property (relations are ignored).
   */
  Absolute,
  /**
   * The value is relative to the value of the first relation.
   */
  First,
  /**
   * The value is relative to the minimum of all relations.
   */
  Min,
  /**
   * The value is relative to the maximum of all relations.
   */
  Max,
  /**
   * The value is the sum of all relations. Used for size "fit-content" with "sum" mode.
   */
  FitContentSum,
  /**
   * The value is the sum of the 2 first relations (padding before and after) 
   * plus the max of the rest of relations (gap and children sizes). Used for size 
   * "fit-content" with "max" mode.
   */
  FitContentMax,
}

type Solver = {
  /**
   * ⚠️ For debugging / inspection purposes only.
   */
  dependencies(prop: RelativeProperty): Generator<RelativeProperty>
  /**
   * Tries to resolve the property. Returns true if resolved, false otherwise.
   */
  tryResolve(prop: RelativeProperty): boolean
}

const solvers: Record<string, Solver> = {
  /**
   * Solver that does nothing and always returns true. Used for absolute values that 
   * do not depend on any relation, or for properties that have already been resolved.
   */
  done: {
    dependencies: function* () { },
    tryResolve: () => {
      return true
    },
  },

  /**
   * Solver that does nothing and always returns false. 
   * 
   * Used for properties that cannot be resolved from solvers (e.g. fractional sizes) 
   * and must be resolved from additional passes (e.g. the fractional pass).
   */
  waiting: {
    dependencies: function* () { },
    tryResolve: () => {
      return false
    },
  },

  zero: {
    dependencies: function* () { },
    tryResolve: (prop) => {
      prop.resolve(0)
      return true
    },
  },

  relativeSizeX: {
    *dependencies(prop) {
      yield prop.node.size_x
    },
    tryResolve(prop) {
      if (prop.node.size_x.resolved === false)
        return false
      prop.resolve(prop.scalar.value * prop.node.size_x.value)
      return true
    },
  },

  relativeSizeY: {
    *dependencies(prop) {
      yield prop.node.size_y
    },
    tryResolve(prop): boolean {
      if (prop.node.size_y.resolved === false)
        return false
      prop.resolve(prop.scalar.value * prop.node.size_y.value)
      return true
    },
  },

  relativeSizeMinXY: {
    *dependencies(prop) {
      yield prop.node.size_x
      yield prop.node.size_y
    },
    tryResolve(prop): boolean {
      if (prop.node.size_x.resolved === false || prop.node.size_y.resolved === false)
        return false
      prop.resolve(prop.scalar.value * Math.min(prop.node.size_x.value, prop.node.size_y.value))
      return true
    },
  },

  relativeSizeMaxXY: {
    *dependencies(prop) {
      yield prop.node.size_x
      yield prop.node.size_y
    },
    tryResolve(prop: RelativeProperty): boolean {
      if (prop.node.size_x.resolved === false || prop.node.size_y.resolved === false)
        return false
      prop.resolve(prop.scalar.value * Math.max(prop.node.size_x.value, prop.node.size_y.value))
      return true
    },
  },

  fitContentTangent: {
    *dependencies(prop) {
      if (prop.node.isHorizontal) {
        yield prop.node.pad_nx
        yield prop.node.pad_px
        yield prop.node.gap
        for (const child of prop.node.children) {
          if (child.isFlow) {
            yield child.size_x
          }
        }
      } else {
        yield prop.node.pad_ny
        yield prop.node.pad_py
        yield prop.node.gap
        for (const child of prop.node.children) {
          if (child.isFlow) {
            yield child.size_y
          }
        }
      }
    },
    tryResolve(prop) {
      const is_h = prop.node.isHorizontal
      const paddingBefore = is_h ? prop.node.pad_nx : prop.node.pad_ny
      const paddingAfter = is_h ? prop.node.pad_px : prop.node.pad_py
      if (paddingBefore.resolved === false || paddingAfter.resolved === false || prop.node.gap.resolved === false)
        return false
      let flowChildCount = 0
      let sum = paddingBefore.value + paddingAfter.value
      for (const child of prop.node.children) {
        if (child.isFlow) {
          const childSize = is_h ? child.size_x : child.size_y
          if (childSize.resolved === false)
            return false
          flowChildCount++
          sum += childSize.value
        }
      }
      const gap = prop.node.gap.value
      const gapCount = Math.max(0, flowChildCount - 1)
      sum += gap * gapCount
      prop.resolve(sum)
      return true
    },
  },

  fitContentNormal: {
    *dependencies(prop) {
      if (prop.node.isHorizontal) {
        yield prop.node.pad_nx
        yield prop.node.pad_px
        for (const child of prop.node.children) {
          if (child.isFlow) {
            yield child.size_x
          }
        }
      } else {
        yield prop.node.pad_ny
        yield prop.node.pad_py
        for (const child of prop.node.children) {
          if (child.isFlow) {
            yield child.size_y
          }
        }
      }
    },
    tryResolve(prop) {
      const is_h = prop.node.isHorizontal
      const paddingBefore = is_h ? prop.node.pad_ny : prop.node.pad_nx
      const paddingAfter = is_h ? prop.node.pad_py : prop.node.pad_px
      if (paddingBefore.resolved === false || paddingAfter.resolved === false)
        return false
      let max = 0
      for (const child of prop.node.children) {
        if (child.isFlow) {
          const childSize = is_h ? child.size_y : child.size_x
          if (childSize.resolved === false)
            return false
          if (childSize.value > max)
            max = childSize.value
        }
      }
      max += paddingBefore.value + paddingAfter.value
      prop.resolve(max)
      return true
    },

  }
}

class RelativeProperty {
  node: Node
  type: PropertyType
  scalar: Scalar
  isFractional: boolean

  algorithm: PropertyAlgorithmStatus = PropertyAlgorithmStatus.Unset
  value = 0
  resolved = false
  solver: Solver = solvers.zero
  // relations = <RelativeProperty[]>[]
  warningMask = 0

  get typeName() { return PropertyType[this.type] }

  get relations(): RelativeProperty[] {
    return [...this.solver.dependencies(this)]
  }

  constructor(node: Node, type: PropertyType, scalar: Scalar, isFractional = false) {
    this.node = node
    this.type = type
    this.scalar = scalar
    this.isFractional = isFractional
  }

  setSolver(solver: Solver): this {
    this.solver = solver
    return this
  }

  addWarning([code]: [number, string]): this {
    this.warningMask |= 1 << code
    return this
  }

  absolute(value: number): this {
    this.setSolver(solvers.done)
    this.resolve(value)
    return this
  }

  invalid([code]: [number, string]): this {
    this.warningMask |= 1 << code
    this.setSolver(solvers.zero)
    this.resolve(0)
    return this
  }

  resolve(value: number): this {
    this.value = value
    this.resolved = true
    return this
  }

  tryResolve(): boolean {
    if (this.resolved)
      return true
    return this.solver.tryResolve(this)
  }

  warnings(): [code: number, message: string][] {
    const result: [code: number, message: string][] = []
    for (const key in Warnings) {
      const [code, message] = Warnings[key]
      if (this.warningMask & (1 << code)) {
        result.push([code, message])
      }
    }
    return result
  }

  toString(): string {
    const t = PropertyType[this.type]
    const r = this.resolved ? '✅' : '🔄'
    const w = this.warningMask === 0 ? '' : ` ⚠️(${this.warnings().length})`
    return `${t}(${this.scalar.toString()}) ${PropertyAlgorithmStatus[this.algorithm]} ${r} (${this.relations.length})${w}`
  }

  toSummaryString(): string {
    const lines = [`${this.toString()}`]
    const warnings = this.warnings()
    for (const relation of this.relations) {
      if (!relation) {
        lines.push(`  - 🛑 null relation!`)
        continue
      }
      lines.push(`  - ${relation.typeName} ${relation.resolved ? '✅' : '🔄'} (${relation.relations.length})`)
    }
    for (const [code, message] of warnings) {
      lines.push(`Warning ${code}: ${message}`)
    }
    return lines.join('\n')
  }
}

function initGap(node: Node) {
  switch (node.space.gap.type) {
    case ScalarType.Absolute:
    case ScalarType.Auto: // Auto is treated as absolute for gap.
    case ScalarType.Fraction: // Fraction has no sense for gap, so it's treated as absolute.
      node.gap
        .setSolver(solvers.done)
        .resolve(node.space.gap.value)
      break

    case ScalarType.Relative:
      if (node.tangentSizeFitContent) {
        // If the node is horizontal and its width is fit-content, the gap is treated as 0.
        node.gap.invalid(Warnings.RelativeToFitContent)
      } else {
        node.gap.setSolver(node.isHorizontal ? solvers.relativeSizeX : solvers.relativeSizeY)
      }
      break

    case ScalarType.OppositeRelative:
      if (node.normalSizeFitContent) {
        // If the node is horizontal and its height is fit-content, the gap is treated as 0.
        node.gap.invalid(Warnings.RelativeToSelfNormalSizeBut)
      } else {
        node.gap.setSolver(node.isHorizontal ? solvers.relativeSizeY : solvers.relativeSizeX)
      }
      break

    case ScalarType.LargerRelative:
    case ScalarType.SmallerRelative:
      if (node.tangentSizeFitContent && node.normalSizeFitContent) {
        node.gap.invalid(Warnings.RelativeToSmallerOrLargerButTangentAndNormalSizeFitContent)
      } else {
        if (node.tangentSizeFitContent) {
          node.gap.invalid(Warnings.RelativeToFitContent)
        } else {
          node.gap
            .setSolver(node.space.gap.type === ScalarType.LargerRelative
              ? solvers.relativeSizeMaxXY
              : solvers.relativeSizeMinXY)
        }
        if (node.normalSizeFitContent) {
          node.gap.invalid(Warnings.RelativeToSelfNormalSizeBut)
        } else {
          node.gap
            .setSolver(node.space.gap.type === ScalarType.LargerRelative
              ? solvers.relativeSizeMaxXY
              : solvers.relativeSizeMinXY)
        }
      }
      break
  }
}

function initPadding(node: Node, scalar: Scalar, prop: RelativeProperty, propIsHorizontal: boolean) {
  switch (scalar.type) {
    case ScalarType.Absolute:
    case ScalarType.Auto: // Auto is treated as absolute for padding.
      prop.absolute(scalar.value)
      break

    case ScalarType.Fraction:
    case ScalarType.Relative: {
      const fitContent = propIsHorizontal ? node.sizeXFitContent : node.sizeYFitContent
      if (fitContent) {
        prop.invalid(Warnings.RelativeToFitContent)
      } else {
        prop.setSolver(node.isHorizontal ? solvers.relativeSizeX : solvers.relativeSizeY)
      }
      break
    }

    case ScalarType.OppositeRelative: {
      const oppositeFitContent = propIsHorizontal ? node.sizeYFitContent : node.sizeXFitContent
      if (oppositeFitContent) {
        prop.invalid(Warnings.RelativeToFitContent)
      } else {
        prop.setSolver(node.isHorizontal ? solvers.relativeSizeY : solvers.relativeSizeX)
      }
      break
    }

    case ScalarType.LargerRelative:
    case ScalarType.SmallerRelative: {
      const fitContent = node.sizeXFitContent || node.sizeYFitContent
      if (fitContent) {
        prop.invalid(Warnings.RelativeToFitContent)
      } else {
        prop.setSolver(scalar.type === ScalarType.LargerRelative
          ? solvers.relativeSizeMaxXY
          : solvers.relativeSizeMinXY)
      }
      break
    }
  }
}

function initSize(node: Node, scalar: Scalar, prop: RelativeProperty, sizeIsHorizontal: boolean) {
  if (scalar.type === ScalarType.Absolute) {
    prop.absolute(scalar.value)
    return
  }

  const sizeIsTangent = sizeIsHorizontal === node.isHorizontal
  const sizeFitContent = sizeIsHorizontal ? node.sizeXFitContent : node.sizeYFitContent

  if (sizeFitContent) {
    if (sizeIsHorizontal) {
      prop.setSolver(sizeIsTangent ? solvers.fitContentTangent : solvers.fitContentNormal)
    } else {
      prop.setSolver(sizeIsTangent ? solvers.fitContentTangent : solvers.fitContentNormal)
    }
    return
  }

  const { parent } = node

  if (parent === null) {
    prop.invalid(Warnings.RelativeToParentButNoParent)
    return
  }

  if (prop.isFractional) {
    prop.setSolver(solvers.waiting)
    return
  }

  switch (scalar.type) {
    case ScalarType.Auto:
    case ScalarType.Fraction:
    case ScalarType.Relative:
      prop.setSolver(sizeIsHorizontal ? solvers.relativeSizeX : solvers.relativeSizeY)
      break

    case ScalarType.OppositeRelative:
      prop.setSolver(sizeIsHorizontal ? solvers.relativeSizeY : solvers.relativeSizeX)
      break

    case ScalarType.LargerRelative:
    case ScalarType.SmallerRelative:
      prop.setSolver(scalar.type === ScalarType.LargerRelative
        ? solvers.relativeSizeMaxXY
        : solvers.relativeSizeMinXY)
      break
  }
}

class Node extends TreeNode {
  static nextId = 0
  static nextUid = 0

  /**
   * LayoutNode UID, unique across multiple layout computations.
   */
  uid = Node.nextUid++

  /**
   * LayoutNode ID, unique per layout computation.
   */
  id = Node.nextId++

  space: Space
  isHorizontal: boolean

  flowChildren = <Node[]>[]
  detachedChildren = <Node[]>[]

  isFlow: boolean
  sizeXFitContent: boolean
  sizeYFitContent: boolean
  tangentSizeFitContent: boolean
  normalSizeFitContent: boolean

  hasFlow = false
  flowHasBeenResolved = false

  pad_px: RelativeProperty
  pad_nx: RelativeProperty
  pad_py: RelativeProperty
  pad_ny: RelativeProperty

  gap: RelativeProperty

  size_x: RelativeProperty
  size_y: RelativeProperty

  // inner_size_x: RelativeProperty
  // inner_size_y: RelativeProperty

  remainingTangentSignedSpace = 0
  remainingTangentSpace = 0

  x = 0
  y = 0

  constructor(parent: Node | null, space: Space) {
    super()
    this.parent = parent as this | null
    this.space = space
    this.isHorizontal = space.direction === Direction.Horizontal
    this.isFlow = space.positioning === Positioning.Flow
    this.sizeXFitContent = space.sizeXFitContent
    this.sizeYFitContent = space.sizeYFitContent
    this.tangentSizeFitContent = this.isHorizontal ? space.sizeXFitContent : space.sizeYFitContent
    this.normalSizeFitContent = this.isHorizontal ? space.sizeYFitContent : space.sizeXFitContent

    for (const childSpace of space.children) {
      const childNode = new Node(this, childSpace)
      this.children.push(childNode as this)
      if (this.isHorizontal) { }
      if (childSpace.positioning === Positioning.Flow) {
        this.flowChildren.push(childNode)
      } else {
        this.detachedChildren.push(childNode)
      }
    }

    this.pad_px = new RelativeProperty(this, PropertyType.PaddingPX, space.padding[P_PX])
    this.pad_nx = new RelativeProperty(this, PropertyType.PaddingNX, space.padding[P_NX])
    this.pad_py = new RelativeProperty(this, PropertyType.PaddingPY, space.padding[P_PY])
    this.pad_ny = new RelativeProperty(this, PropertyType.PaddingNY, space.padding[P_NY])

    this.gap = new RelativeProperty(this, PropertyType.Gap, space.gap)

    const isFractionalSizeX = space.positioning === Positioning.Flow
      && (space.sizeX.type === ScalarType.Fraction || space.sizeX.type === ScalarType.Auto)
      && space.direction === Direction.Horizontal
    this.size_x = new RelativeProperty(this, PropertyType.SizeX, space.sizeX, isFractionalSizeX)

    const isFractionalSizeY = space.positioning === Positioning.Flow
      && (space.sizeY.type === ScalarType.Fraction || space.sizeY.type === ScalarType.Auto)
      && space.direction === Direction.Vertical
    this.size_y = new RelativeProperty(this, PropertyType.SizeY, space.sizeY, isFractionalSizeY)
  }

  initialize(): this {
    initGap(this)
    initPadding(this, this.space.padding[P_NX], this.pad_nx, true)
    initPadding(this, this.space.padding[P_PX], this.pad_px, true)
    initPadding(this, this.space.padding[P_NY], this.pad_ny, false)
    initPadding(this, this.space.padding[P_PY], this.pad_py, false)
    initSize(this, this.space.sizeX, this.size_x, true)
    initSize(this, this.space.sizeY, this.size_y, false)

    for (const child of this.children) {
      if (child.isFlow)
        this.hasFlow = true

      child.initialize()
    }

    return this
  }

  /**
   * Fractional sizes cannot be resolved separately since they depend on each other.
   * 
   * This method is responsible for resolving fractional sizes once all non-fractional sizes have been resolved.
   */
  tryResolveFlow() {
    if (!this.hasFlow || this.flowHasBeenResolved)
      return

    if (this.gap.resolved === false)
      return

    const is_h = this.isHorizontal
    const selfSize = is_h ? this.size_x : this.size_y
    const paddingBefore = is_h ? this.pad_nx : this.pad_ny
    const paddingAfter = is_h ? this.pad_px : this.pad_py

    if (selfSize.resolved === false)
      return

    const totalSpace = selfSize.value

    let totalFraction = 0
    let totalSize = 0
    let childCount = 0

    for (const child of this.children) {
      if (child.isFlow === false)
        continue

      const childSize = is_h ? child.size_x : child.size_y
      if (childSize.isFractional) {
        totalFraction += childSize.scalar.value
      } else {
        if (!childSize.resolved)
          return
        totalSize += childSize.scalar.value
      }

      childCount++
    }

    const gap = this.gap.value * Math.max(0, childCount - 1)
    let remainingSignedSpace = totalSpace - totalSize - paddingBefore.value - paddingAfter.value - gap
    let remainingSpace = Math.max(0, remainingSignedSpace)

    for (const child of this.children) {
      if (child.isFlow === false)
        continue

      const childSize = is_h ? child.size_x : child.size_y
      if (childSize.isFractional) {
        const resolvedSize = remainingSpace * childSize.scalar.value / totalFraction
        childSize.resolve(resolvedSize)

        // Remaining space is consumed.
        remainingSignedSpace = 0
      }
    }

    this.remainingTangentSignedSpace = remainingSignedSpace
    this.remainingTangentSpace = remainingSpace
    this.flowHasBeenResolved = true
  }

  *relativeProperties(): Generator<RelativeProperty> {
    yield this.gap
    yield this.pad_ny
    yield this.pad_py
    yield this.pad_nx
    yield this.pad_px
    yield this.size_x
    yield this.size_y
  }

  *dependencies(): Generator<[RelativeProperty, RelativeProperty]> {
    for (const value of this.relativeProperties()) {
      if (value.resolved === false) {
        for (const relation of value.relations) {
          yield [value, relation]
        }
      }
    }
  }

  warningsCount(): number {
    let count = 0
    for (const value of this.relativeProperties()) {
      const warnings = value.warnings()
      count += warnings.length
    }
    return count
  }

  treeWarningsCount(): number {
    let count = this.warningsCount()
    for (const child of this.children) {
      count += child.treeWarningsCount()
    }
    return count
  }

  toString(): string {
    return `#${this.id}`
  }

  toDependenciesString(): string {
    const lines = [] as string[]
    let dependenciesCount = 0
    for (const prop of this.relativeProperties()) {
      if (prop.resolved)
        continue
      lines.push(`- [${PropertyType[prop.type]} "${PropertyAlgorithmStatus[prop.algorithm]}"] (${prop.relations.length}):`)
      dependenciesCount += prop.relations.length
      for (const relation of prop.relations) {
        lines.push(`  - [#${relation.node.id} ${PropertyType[relation.type]} ${relation.resolved ? '✅' : '🔄'}]`)
      }
    }
    if (dependenciesCount === 0) {
      return `Node #${this.id} has no dependencies. ✅`
    }
    return [
      `Node #${this.id} dependencies (${dependenciesCount}):`,
      ...lines,
    ].join('\n')
  }

  toWarningsString() {
    const warnings = [] as string[]
    for (const relativeValue of this.relativeProperties()) {
      const relativeWarnings = relativeValue.warnings()
      if (relativeWarnings.length === 0)
        continue
      warnings.push(`- ${relativeValue.toString()}`)
      for (const [code, message] of relativeWarnings) {
        warnings.push(`  - ⚠️ (#${code}) ${message}`)
      }
    }
    return warnings.join('\n')
  }

  toTreeWithDependenciesString({
    onlyUnresolved = false
  } = {}): string {
    return this.toTreeString({
      nodeToString: (node: Node) => {
        return `${node.toString()} (${node.path().join('.')})`
      },
      afterNode: (node: Node) => {
        const lines = [] as string[]
        for (const prop of node.relativeProperties()) {
          if (onlyUnresolved && prop.resolved)
            continue
          lines.push(`${PropertyType[prop.type]} "${PropertyAlgorithmStatus[prop.algorithm]}" (${prop.relations.length} relations)`)
          for (const relation of prop.relations) {
            lines.push(`- ${relation.resolved ? '✅' : '🔄'} [#${relation.node.id} ${PropertyType[relation.type]}]`)
          }
        }
        return lines.join('\n')
      },
    })
  }
}

function findCycle<T>(nodes: T[], getDeps: (node: T) => T[]): T[] | null {
  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Map(nodes.map(n => [n, WHITE]))

  function visit(node: T, stack: T[]): T[] | null {
    if (color.get(node) === GRAY) {
      const i = stack.indexOf(node)
      return [...stack.slice(i), node] // cycle, closing the loop
    }
    if (color.get(node) === BLACK)
      return null

    color.set(node, GRAY)
    stack.push(node)

    for (const dep of getDeps(node)) {
      const cycle = visit(dep, stack)
      if (cycle)
        return cycle
    }

    stack.pop()
    color.set(node, BLACK)
    return null
  }

  for (const node of nodes) {
    if (color.get(node) === WHITE) {
      const cycle = visit(node, [])
      if (cycle)
        return cycle
    }
  }

  return null
}

function processCircularDependencies(stack: Node[], log = false) {
  const allProperties = stack.map(node => [...node.relativeProperties()]).flat()

  if (log)
    console.log(allProperties.map(p => `${p.node} -> ${p}`).join('\n'))

  while (true) {
    const cycle = findCycle(
      allProperties,
      (prop: RelativeProperty) => prop.relations.filter(p => {
        return p.resolved === false
      }),
    )

    if (cycle) {
      if (log)
        console.log(K.red('Cycle detected in dependencies:'))

      for (const prop of cycle) {
        if (log)
          console.log(prop.toString())

        prop.addWarning(Warnings.CircularDependency)
        prop.resolve(0)
      }
    }

    else {
      break
    }
  }
}

function sizePass(stack: Node[]) {
  const nextStack = [] as Node[]

  let pass = 0
  let passMax = stack.length * 2
  while (stack.length > 0 && pass++ < passMax) {
    if (pass === passMax) {
      console.log(K.red('Max pass count reached. Possible circular dependency.'))
    }
    const node = stack.shift()!

    let allResolved = true
    for (const prop of node.relativeProperties()) {
      const resolved = prop.tryResolve()
      if (resolved === false) {
        allResolved = false
      }
    }

    node.tryResolveFlow()

    // console.log(`#${node.id} allResolved: ${allResolved}`)
    if (allResolved === false) {
      nextStack.push(node)
    }

    if (stack.length === 0) {
      // Reversed nextStack to optimize passes:
      // - Top-down on the first pass, which is more likely to resolve root dependencies first.
      // - Bottom-up on the next passes, which is more likely to resolve leaf dependencies first.
      for (let i = nextStack.length - 1; i >= 0; i--) {
        stack.push(nextStack[i])
      }
      nextStack.length = 0
    }
  }
}

function positionPass(node: Node) {
  {
    // Flow:
    let x = node.x + node.pad_nx.value
    let y = node.y + node.pad_ny.value
    const inner_sx = node.size_x.value - node.pad_nx.value - node.pad_px.value
    const inner_sy = node.size_y.value - node.pad_ny.value - node.pad_py.value
    if (node.isHorizontal) {
      x += node.remainingTangentSignedSpace * node.space.alignChildrenX
      for (const child of node.children) {
        if (child.isFlow) {
          child.x = x
          child.y = y + (inner_sy - child.size_y.value) * (child.space.alignY ?? node.space.alignChildrenY)
          x += child.size_x.value + node.gap.value
        }
      }
    }
  }
  {
    // Detached:
  }

  for (const child of node.children) {
    positionPass(child)
  }
}

function applyLayout(node: Node) {
  const { rect } = node.space

  rect.x = node.x
  rect.y = node.y
  rect.width = node.size_x.value
  rect.height = node.size_y.value

  for (const child of node.children) {
    applyLayout(child)
  }
}

export function computeLayout4(rootSpace: Space, rootRect?: RectangleDeclaration) {
  Node.nextId = 0

  const root = new Node(null, rootSpace).initialize()

  if (rootRect) {
    const { x, y, width, height } = Rectangle.from(rootRect)
    root.x = x
    root.y = y
    root.size_x.resolve(width)
    root.size_y.resolve(height)
  } else {
    root.x = rootSpace.offsetX.value
    root.y = rootSpace.offsetY.value
  }

  const stack = [...root.flattened()]

  processCircularDependencies(stack)

  sizePass(stack)

  positionPass(root)

  applyLayout(root)

  return root
}