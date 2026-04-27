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
  RelativeToSelfTangentSizeBut: [
    warningCode++,
    'Value cannot be relative to self tangent size but tangent size "fit-content" at the same time.',
  ],
  RelativeToSelfNormalSizeBut: [
    warningCode++,
    'Value cannot be relative to self normal size but normal size "fit-content" at the same time.',
  ],
  RelativeToSmallerOrLargerButTangentAndNormalSizeFitContent: [
    warningCode++,
    'Value cannot be smaller/larger relative if both tangent and normal size are "fit-content".',
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

class RelativeProperty {
  node: Node
  type: PropertyType
  scalar: Scalar
  isFractional: boolean

  algorithm: PropertyAlgorithmStatus = PropertyAlgorithmStatus.Unset
  value = 0
  resolved = false
  relations = <RelativeProperty[]>[]
  warningMask = 0

  get typeName() { return PropertyType[this.type] }

  constructor(node: Node, type: PropertyType, scalar: Scalar, isFractional = false) {
    this.node = node
    this.type = type
    this.scalar = scalar
    this.isFractional = isFractional
  }

  setAlgorithm(algorithm: PropertyAlgorithmStatus): this {
    this.algorithm = algorithm
    return this
  }

  addWarning([code]: [number, string]): this {
    this.warningMask |= 1 << code
    return this
  }

  addRelations(...values: RelativeProperty[]): this {
    this.relations.push(...values)
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

    switch (this.algorithm) {
      case PropertyAlgorithmStatus.First: {
        if (this.relations.length === 0)
          throw new InternalError('First algorithm requires at least 1 relation.')
        const relation = this.relations[0]
        if (!relation.resolved)
          return false
        this.resolve(this.scalar.value * relation.value)
        return true
      }

      case PropertyAlgorithmStatus.Min: {
        if (this.relations.length === 0)
          throw new InternalError('Min algorithm requires at least 1 relation.')
        let min = Infinity
        for (const relation of this.relations) {
          if (!relation.resolved)
            return false
          if (relation.value < min)
            min = relation.value
        }
        this.resolve(this.scalar.value * min)
        return true
      }

      case PropertyAlgorithmStatus.Max: {
        if (this.relations.length === 0)
          throw new Error('AlgoError: Max algorithm requires at least 1 relation.')
        let max = -Infinity
        for (const relation of this.relations) {
          if (!relation.resolved)
            return false
          if (relation.value > max)
            max = relation.value
        }
        this.resolve(this.scalar.value * max)
        return true
      }

      case PropertyAlgorithmStatus.FitContentSum: {
        if (this.relations.length < 3)
          throw new Error('AlgoError: FitContentSum algorithm requires at least 3 relations.')
        if (!this.relations[0].resolved || !this.relations[1].resolved || !this.relations[2].resolved)
          return false
        const gap = this.relations[2].value
        const gapCount = Math.max(0, this.relations.length - 3 - 1)
        const paddingSum = this.relations[0].value + this.relations[1].value
        let sum = 0
        for (let i = 3; i < this.relations.length; i++) {
          const relation = this.relations[i]
          if (!relation.resolved)
            return false
          sum += relation.value
        }
        this.resolve(paddingSum + gap * gapCount + sum)
        return true
      }

      case PropertyAlgorithmStatus.FitContentMax: {
        if (this.relations.length < 2) {
          console.log(this.node.toDependenciesString())
          console.log(this.node.root().toTreeString())
          console.log(this.node.size_x.scalar.type)
          throw new Error('AlgoError: FitContentMax algorithm requires at least 2 relations.')
        }
        if (!this.relations[0].resolved || !this.relations[1].resolved)
          return false
        const paddingSum = this.relations[0].value + this.relations[1].value
        let max = 0
        for (let i = 2; i < this.relations.length; i++) {
          const relation = this.relations[i]
          if (!relation.resolved)
            return false
          if (relation.value > max)
            max = relation.value
        }
        this.resolve(paddingSum + max)
        return true
      }
    }

    return false
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
        .setAlgorithm(PropertyAlgorithmStatus.Absolute)
        .resolve(node.space.gap.value)
      break

    case ScalarType.Relative:
      if (node.tangentSizeFitContent) {
        // If the node is horizontal and its width is fit-content, the gap is treated as 0.
        node.gap.addWarning(Warnings.RelativeToSelfTangentSizeBut)
        node.gap.resolve(0)
      } else {
        node.gap
          .setAlgorithm(PropertyAlgorithmStatus.First)
          .addRelations(node.isHorizontal
            ? node.size_x
            : node.size_y)
      }
      break

    case ScalarType.OppositeRelative:
      if (node.normalSizeFitContent) {
        // If the node is horizontal and its height is fit-content, the gap is treated as 0.
        node.gap.addWarning(Warnings.RelativeToSelfNormalSizeBut)
        node.gap.resolve(0)
      } else {
        node.gap
          .setAlgorithm(PropertyAlgorithmStatus.First)
          .addRelations(node.isHorizontal
            ? node.size_y
            : node.size_x)
      }
      break

    case ScalarType.LargerRelative:
    case ScalarType.SmallerRelative:
      if (node.tangentSizeFitContent && node.normalSizeFitContent) {
        node.gap.addWarning(Warnings.RelativeToSmallerOrLargerButTangentAndNormalSizeFitContent)
        node.gap.resolve(0)
      } else {
        if (node.tangentSizeFitContent) {
          node.gap.addWarning(Warnings.RelativeToSelfTangentSizeBut)
        } else {
          node.gap
            .setAlgorithm(node.space.gap.type === ScalarType.LargerRelative
              ? PropertyAlgorithmStatus.Max
              : PropertyAlgorithmStatus.Min)
            .addRelations(
              node.size_x,
              node.size_y)
        }
        if (node.normalSizeFitContent) {
          node.gap.addWarning(Warnings.RelativeToSelfNormalSizeBut)
        } else {
          node.gap
            .setAlgorithm(node.space.gap.type === ScalarType.LargerRelative
              ? PropertyAlgorithmStatus.Max
              : PropertyAlgorithmStatus.Min)
            .addRelations(
              node.size_x,
              node.size_y)
        }
      }
      break
  }
}

function initPadding(node: Node, scalar: Scalar, prop: RelativeProperty, paddingDirection: Direction) {
  const isTangent = node.isHorizontal === (paddingDirection === Direction.Horizontal)
  const sizeFitContent = isTangent ? node.tangentSizeFitContent : node.normalSizeFitContent
  switch (scalar.type) {
    case ScalarType.Absolute:
    case ScalarType.Auto: // Auto is treated as absolute for padding.
    case ScalarType.Fraction: // Fraction has no sense for padding, so it's treated as absolute.
      prop
        .setAlgorithm(PropertyAlgorithmStatus.Absolute)
        .resolve(scalar.value)
      break

    case ScalarType.Relative:
      if (sizeFitContent) {
        // If the node is horizontal and its width is fit-content, the padding is treated as 0.
        prop.addWarning(isTangent ? Warnings.RelativeToSelfTangentSizeBut : Warnings.RelativeToSelfNormalSizeBut)
        prop.resolve(0)
      } else {
        const h = prop.type === PropertyType.PaddingPX || prop.type === PropertyType.PaddingPY
        prop
          .setAlgorithm(PropertyAlgorithmStatus.First)
          .addRelations(h
            ? node.size_x
            : node.size_y)
      }
      break

    case ScalarType.OppositeRelative:
      if (sizeFitContent) {
        // If the node is horizontal and its width is fit-content, the padding is treated as 0.
        prop.addWarning(isTangent ? Warnings.RelativeToSelfTangentSizeBut : Warnings.RelativeToSelfNormalSizeBut)
        prop.resolve(0)
      } else {
        const h = prop.type === PropertyType.PaddingPX || prop.type === PropertyType.PaddingPY
        prop
          .setAlgorithm(PropertyAlgorithmStatus.First)
          .addRelations(h
            ? node.size_y
            : node.size_x)
      }
      break

    case ScalarType.LargerRelative:
    case ScalarType.SmallerRelative:
      if (node.tangentSizeFitContent && node.normalSizeFitContent) {
        prop.addWarning(Warnings.RelativeToSmallerOrLargerButTangentAndNormalSizeFitContent)
        prop.resolve(0)
      } else {
        if (sizeFitContent) {
          prop.addWarning(isTangent ? Warnings.RelativeToSelfTangentSizeBut : Warnings.RelativeToSelfNormalSizeBut)
        } else {
          prop
            .setAlgorithm(scalar.type === ScalarType.LargerRelative
              ? PropertyAlgorithmStatus.Max
              : PropertyAlgorithmStatus.Min)
            .addRelations(
              node.size_x,
              node.size_y)
        }
        if (sizeFitContent) {
          prop.addWarning(isTangent ? Warnings.RelativeToSelfTangentSizeBut : Warnings.RelativeToSelfNormalSizeBut)
        } else {
          prop
            .setAlgorithm(scalar.type === ScalarType.LargerRelative
              ? PropertyAlgorithmStatus.Max
              : PropertyAlgorithmStatus.Min)
            .addRelations(
              node.size_x,
              node.size_y)
        }
      }
      break
  }
}

function initSize(node: Node, scalar: Scalar, prop: RelativeProperty, sizeDirection: Direction) {
  if (scalar.type === ScalarType.Absolute) {
    prop
      .setAlgorithm(PropertyAlgorithmStatus.Absolute)
      .resolve(scalar.value)
    return
  }

  const sizeIsTangent = sizeDirection === node.space.direction
  const sizeIsHorizontal = sizeDirection === Direction.Horizontal
  const sizeFitContent = sizeIsTangent
    ? node.tangentSizeFitContent
    : node.normalSizeFitContent

  if (sizeFitContent) {
    if (sizeIsHorizontal) {
      prop
        .setAlgorithm(sizeIsTangent ? PropertyAlgorithmStatus.FitContentSum : PropertyAlgorithmStatus.FitContentMax)
        .addRelations(node.pad_nx, node.pad_px)
      if (sizeIsTangent)
        prop.addRelations(node.gap)
      for (const child of node.flowChildren) {
        prop.addRelations(child.size_x)
      }
    } else {
      prop
        .setAlgorithm(sizeIsTangent ? PropertyAlgorithmStatus.FitContentSum : PropertyAlgorithmStatus.FitContentMax)
        .addRelations(node.pad_ny, node.pad_py)
      if (sizeIsTangent)
        prop.addRelations(node.gap)
      for (const child of node.flowChildren) {
        prop.addRelations(child.size_y)
      }
    }
    return
  }

  const { parent } = node

  if (parent === null) {
    prop.resolve(0)
    prop.addWarning(Warnings.RelativeToParentButNoParent)
    return
  }

  if (prop.isFractional) {
    prop.setAlgorithm(PropertyAlgorithmStatus.Fraction)
    return
  }

  switch (scalar.type) {
    case ScalarType.Auto:
    case ScalarType.Fraction:
    case ScalarType.Relative:
      prop
        .setAlgorithm(PropertyAlgorithmStatus.First)
        .addRelations(sizeIsHorizontal
          ? parent.size_x
          : parent.size_y)
      break

    case ScalarType.OppositeRelative:
      prop
        .setAlgorithm(PropertyAlgorithmStatus.First)
        .addRelations(sizeIsHorizontal
          ? parent.size_y
          : parent.size_x)
      break

    case ScalarType.LargerRelative:
    case ScalarType.SmallerRelative:
      prop
        .setAlgorithm(scalar.type === ScalarType.LargerRelative
          ? PropertyAlgorithmStatus.Max
          : PropertyAlgorithmStatus.Min)
        .addRelations(
          parent.size_x,
          parent.size_y)
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
    initPadding(this, this.space.padding[P_NY], this.pad_ny, Direction.Vertical)
    initPadding(this, this.space.padding[P_PY], this.pad_py, Direction.Vertical)
    initPadding(this, this.space.padding[P_NX], this.pad_nx, Direction.Horizontal)
    initPadding(this, this.space.padding[P_PX], this.pad_px, Direction.Horizontal)
    initSize(this, this.space.sizeX, this.size_x, Direction.Horizontal)
    initSize(this, this.space.sizeY, this.size_y, Direction.Vertical)

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