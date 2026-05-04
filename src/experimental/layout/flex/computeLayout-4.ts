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
type WarningEntry = [code: number, message: string]
const Warnings = {
  RelativeToParentButNoParent: <WarningEntry>[
    warningCode++,
    'Property is relative to parent but node has no parent.',
  ],
  RelativeToFitContent: <WarningEntry>[
    warningCode++,
    'Value cannot be relative to self to a size that is fit-content.',
  ],
  CircularDependency: <WarningEntry>[
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

type Solver = {
  name: string
  /**
   * ⚠️ For debugging / inspection purposes only.
   */
  dependencies(prop: RelativeProperty): Generator<RelativeProperty>
  /**
   * Tries to resolve the property (mutation). Returns true if resolved, false otherwise.
   */
  tryResolve(prop: RelativeProperty): boolean
}

const solvers = {
  /**
   * Solver that does nothing and always returns true. Used for absolute values that 
   * do not depend on any relation, or for properties that have already been resolved.
   */
  done: <Solver>{
    name: 'done',
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
  waiting: <Solver>{
    name: 'waiting',
    dependencies: function* () { },
    tryResolve: () => {
      return false
    },
  },

  zero: <Solver>{
    name: 'zero',
    dependencies: function* () { },
    tryResolve: (prop) => {
      prop.resolve(0)
      return true
    },
  },

  relativeToSizeX: <Solver>{
    name: 'relativeToSizeX',
    *dependencies(prop) {
      yield prop.node.size_x
    },
    tryResolve(prop) {
      if (prop.node.size_x.resolved === false)
        return false
      prop.resolve(prop.scalarValue * prop.node.size_x.value)
      return true
    },
  },

  relativeToSizeY: <Solver>{
    name: 'relativeToSizeY',
    *dependencies(prop) {
      yield prop.node.size_y
    },
    tryResolve(prop): boolean {
      if (prop.node.size_y.resolved === false)
        return false
      prop.resolve(prop.scalarValue * prop.node.size_y.value)
      return true
    },
  },

  relativeToSizeMinXY: <Solver>{
    name: 'relativeToSizeMinXY',
    *dependencies(prop) {
      yield prop.node.size_x
      yield prop.node.size_y
    },
    tryResolve(prop): boolean {
      const { size_x, size_y } = prop.node
      if (size_x.resolved === false || size_y.resolved === false)
        return false
      prop.resolve(prop.scalarValue * Math.min(size_x.value, size_y.value))
      return true
    }
  },

  relativeToSizeMaxXY: <Solver>{
    name: 'relativeToSizeMaxXY',
    *dependencies(prop) {
      yield prop.node.size_x
      yield prop.node.size_y
    },
    tryResolve(prop): boolean {
      const { size_x, size_y } = prop.node
      if (size_x.resolved === false || size_y.resolved === false)
        return false
      prop.resolve(prop.scalarValue * Math.max(size_x.value, size_y.value))
      return true
    }
  },

  relativeToInnerSizeMinXY: <Solver>{
    name: 'relativeToInnerSizeMinXY',
    *dependencies(prop) {
      yield prop.node.inner_size_x
      yield prop.node.inner_size_y
    },
    tryResolve(prop): boolean {
      const { inner_size_x, inner_size_y } = prop.node
      if (inner_size_x.resolved === false || inner_size_y.resolved === false)
        return false
      prop.resolve(prop.scalarValue * Math.min(inner_size_x.value, inner_size_y.value))
      return true
    }
  },

  relativeToInnerSizeMaxXY: <Solver>{
    name: 'relativeToInnerSizeMaxXY',
    *dependencies(prop) {
      yield prop.node.inner_size_x
      yield prop.node.inner_size_y
    },
    tryResolve(prop): boolean {
      const { inner_size_x, inner_size_y } = prop.node
      if (inner_size_x.resolved === false || inner_size_y.resolved === false)
        return false
      prop.resolve(prop.scalarValue * Math.max(inner_size_x.value, inner_size_y.value))
      return true
    }
  },

  copyParentSizeX: <Solver>{
    name: 'copyParentSizeX',
    *dependencies(prop) {
      yield prop.node.parent!.size_x
    },
    tryResolve(prop) {
      const { size_x } = prop.node.parent!
      if (size_x.resolved === false)
        return false
      prop.resolve(size_x.value)
      return true
    },
  },

  copyParentSizeY: <Solver>{
    name: 'copyParentSizeY',
    *dependencies(prop) {
      yield prop.node.parent!.size_y
    },
    tryResolve(prop) {
      const { size_y } = prop.node.parent!
      if (size_y.resolved === false)
        return false
      prop.resolve(size_y.value)
      return true
    },
  },

  copyParentInnerSizeX: <Solver>{
    name: 'copyParentInnerSizeX',
    *dependencies(prop) {
      yield prop.node.parent!.inner_size_x
    },
    tryResolve(prop) {
      const { inner_size_x } = prop.node.parent!
      if (inner_size_x.resolved === false)
        return false
      prop.resolve(inner_size_x.value)
      return true
    },
  },

  copyParentInnerSizeY: <Solver>{
    name: 'copyParentInnerSizeY',
    *dependencies(prop) {
      yield prop.node.parent!.inner_size_y
    },
    tryResolve(prop) {
      const { inner_size_y } = prop.node.parent!
      if (inner_size_y.resolved === false)
        return false
      prop.resolve(inner_size_y.value)
      return true
    },
  },

  relativeToParentSizeX: <Solver>{
    name: 'relativeToParentSizeX',
    *dependencies(prop) {
      yield prop.node.parent!.size_x
    },
    tryResolve(prop) {
      const { size_x } = prop.node.parent!
      if (size_x.resolved === false)
        return false
      prop.resolve(prop.scalarValue * size_x.value)
      return true
    },
  },

  relativeToParentSizeY: <Solver>{
    name: 'relativeToParentSizeY',
    *dependencies(prop) {
      yield prop.node.parent!.size_y
    },
    tryResolve(prop) {
      const { size_y } = prop.node.parent!
      if (size_y.resolved === false)
        return false
      prop.resolve(prop.scalarValue * size_y.value)
      return true
    },
  },

  relativeToParentSizeMinXY: <Solver>{
    name: 'relativeToParentSizeMinXY',
    *dependencies(prop) {
      yield prop.node.parent!.size_x
      yield prop.node.parent!.size_y
    },
    tryResolve(prop): boolean {
      const { size_x, size_y } = prop.node.parent!
      if (size_x.resolved === false || size_y.resolved === false)
        return false
      prop.resolve(prop.scalarValue * Math.min(size_x.value, size_y.value))
      return true
    }
  },

  relativeToParentSizeMaxXY: <Solver>{
    name: 'relativeToParentSizeMaxXY',
    *dependencies(prop) {
      yield prop.node.parent!.size_x
      yield prop.node.parent!.size_y
    },
    tryResolve(prop): boolean {
      const { size_x, size_y } = prop.node.parent!
      if (size_x.resolved === false || size_y.resolved === false)
        return false
      prop.resolve(prop.scalarValue * Math.max(size_x.value, size_y.value))
      return true
    }
  },

  relativeToParentInnerSizeX: <Solver>{
    name: 'relativeToParentInnerSizeX',
    *dependencies(prop) {
      yield prop.node.parent!.inner_size_x
    },
    tryResolve(prop) {
      const { inner_size_x } = prop.node.parent!
      if (inner_size_x.resolved === false)
        return false
      prop.resolve(prop.scalarValue * inner_size_x.value)
      return true
    },
  },

  relativeToParentInnerSizeY: <Solver>{
    name: 'relativeToParentInnerSizeY',
    *dependencies(prop) {
      yield prop.node.parent!.inner_size_y
    },
    tryResolve(prop) {
      const { inner_size_y } = prop.node.parent!
      if (inner_size_y.resolved === false)
        return false
      prop.resolve(prop.scalarValue * inner_size_y.value)
      return true
    },
  },

  relativeToParentInnerSizeMinXY: <Solver>{
    name: 'relativeToParentInnerSizeMinXY',
    *dependencies(prop) {
      yield prop.node.parent!.inner_size_x
      yield prop.node.parent!.inner_size_y
    },
    tryResolve(prop): boolean {
      const { inner_size_x, inner_size_y } = prop.node.parent!
      if (inner_size_x.resolved === false || inner_size_y.resolved === false)
        return false
      prop.resolve(prop.scalarValue * Math.min(inner_size_x.value, inner_size_y.value))
      return true
    }
  },

  relativeToParentInnerSizeMaxXY: <Solver>{
    name: 'relativeToParentInnerSizeMaxXY',
    *dependencies(prop) {
      yield prop.node.parent!.inner_size_x
      yield prop.node.parent!.inner_size_y
    },
    tryResolve(prop): boolean {
      const { inner_size_x, inner_size_y } = prop.node.parent!
      if (inner_size_x.resolved === false || inner_size_y.resolved === false)
        return false
      prop.resolve(prop.scalarValue * Math.max(inner_size_x.value, inner_size_y.value))
      return true
    }
  },

  addPaddingToInnerSizeX: <Solver>{
    name: 'addPaddingToInnerSizeX',
    *dependencies(prop) {
      yield prop.node.pad_nx
      yield prop.node.pad_px
      yield prop.node.inner_size_x
    },
    tryResolve(prop) {
      const { inner_size_x, pad_nx, pad_px } = prop.node
      if (inner_size_x.resolved === false || pad_nx.resolved === false || pad_px.resolved === false)
        return false
      prop.resolve(inner_size_x.value + pad_nx.value + pad_px.value)
      return true
    },
  },

  addPaddingToInnerSizeY: <Solver>{
    name: 'addPaddingToInnerSizeY',
    *dependencies(prop) {
      yield prop.node.pad_ny
      yield prop.node.pad_py
      yield prop.node.inner_size_y
    },
    tryResolve(prop) {
      const { inner_size_y, pad_ny, pad_py } = prop.node
      if (inner_size_y.resolved === false || pad_ny.resolved === false || pad_py.resolved === false)
        return false
      prop.resolve(inner_size_y.value + pad_ny.value + pad_py.value)
      return true
    },
  },

  removePaddingFromSizeX: <Solver>{
    name: 'removePaddingFromSizeX',
    *dependencies(prop) {
      yield prop.node.size_x
      yield prop.node.pad_nx
      yield prop.node.pad_px
    },
    tryResolve(prop) {
      const { size_x, pad_nx, pad_px } = prop.node
      if (size_x.resolved === false || pad_nx.resolved === false || pad_px.resolved === false)
        return false
      prop.resolve(Math.max(0, size_x.value - pad_nx.value - pad_px.value))
      return true
    },
  },

  removePaddingFromSizeY: <Solver>{
    name: 'removePaddingFromSizeY',
    *dependencies(prop) {
      yield prop.node.size_y
      yield prop.node.pad_ny
      yield prop.node.pad_py
    },
    tryResolve(prop) {
      const { size_y, pad_ny, pad_py } = prop.node
      if (size_y.resolved === false || pad_ny.resolved === false || pad_py.resolved === false)
        return false
      prop.resolve(Math.max(0, size_y.value - pad_ny.value - pad_py.value))
      return true
    },
  },

  fitContentTangent: <Solver>{
    name: 'fitContentTangent',
    *dependencies(prop) {
      if (prop.node.isHorizontal) {
        yield prop.node.gap
        for (const child of prop.node.children) {
          if (child.isFlow) {
            yield child.size_x
          }
        }
      } else {
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
      const { gap } = prop.node
      if (gap.resolved === false)
        return false
      let flowChildCount = 0
      let sum = 0
      for (const child of prop.node.children) {
        if (child.isFlow) {
          const childSize = is_h ? child.size_x : child.size_y
          if (childSize.resolved === false)
            return false
          flowChildCount++
          sum += childSize.value
        }
      }
      const gapCount = Math.max(0, flowChildCount - 1)
      sum += gap.value * gapCount
      prop.resolve(sum)
      return true
    },
  },

  fitContentNormal: <Solver>{
    name: 'fitContentNormal',
    *dependencies(prop) {
      if (prop.node.isHorizontal) {
        for (const child of prop.node.children) {
          if (child.isFlow) {
            yield child.size_y
          }
        }
      } else {
        for (const child of prop.node.children) {
          if (child.isFlow) {
            yield child.size_x
          }
        }
      }
    },
    tryResolve(prop) {
      const is_h = prop.node.isHorizontal
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
      prop.resolve(max)
      return true
    },
  },

  applyAspectToSizeXFromSizeY: <Solver>{
    name: 'applyAspectToSizeXFromSizeY',
    *dependencies(prop) {
      yield prop.node.size_y
    },
    tryResolve(prop) {
      const { size_y } = prop.node
      if (size_y.resolved === false)
        return false
      const aspect = prop.node.space.aspect!
      prop.resolve(size_y.value * aspect)
      return true
    },
  },

  applyAspectToSizeYFromSizeX: <Solver>{
    name: 'applyAspectToSizeYFromSizeX',
    *dependencies(prop) {
      yield prop.node.size_x
    },
    tryResolve(prop) {
      const { size_x } = prop.node
      if (size_x.resolved === false)
        return false
      const aspect = prop.node.space.aspect!
      prop.resolve(size_x.value / aspect)
      return true
    },
  },
}

class RelativeProperty {
  node: Node
  type: PropertyType
  scalarType: ScalarType
  scalarValue: number
  isFractional: boolean

  value = 0
  resolved = false
  solver = solvers.zero
  warningMask = 0

  get typeName() { return PropertyType[this.type] }

  get dependencies(): RelativeProperty[] {
    return [...this.solver.dependencies(this)]
  }

  constructor(node: Node, type: PropertyType, scalar: Scalar, isFractional = false) {
    this.node = node
    this.type = type
    this.scalarType = scalar.type
    this.scalarValue = scalar.value
    this.isFractional = isFractional

    if (this.scalarType === ScalarType.Auto) {
      // Auto values must be 1 for the resolution to work
      this.scalarValue = 1
    }
  }

  setSolver(solver: Solver): this {
    this.solver = solver
    return this
  }

  addWarning([code]: WarningEntry): this {
    this.warningMask |= 1 << code
    return this
  }

  absolute(value: number): this {
    this.setSolver(solvers.done)
    this.resolve(value)
    return this
  }

  invalid([code]: WarningEntry): this {
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
      const [code, message] = Warnings[key as keyof typeof Warnings]
      if (this.warningMask & (1 << code)) {
        result.push([code, message])
      }
    }
    return result
  }

  toString(): string {
    const r = this.resolved ? '✅' : '🔶'
    const n = this.node.treeId
    const t = PropertyType[this.type]
    const s = `${ScalarType[this.scalarType]}(${this.scalarValue})`
    const v = this.resolved ? ` > ${this.value}` : ''
    const w = this.warningMask === 0 ? '' : ` ⚠️(${this.warnings().length})`
    return `${r} N${n}.${t} (${s}${v}) "${this.solver.name}" (${this.dependencies.length} 🔗)${w}`
  }

  toSummaryString(): string {
    const lines = [`${this.toString()}`]
    const warnings = this.warnings()
    for (const dep of this.dependencies) {
      if (!dep) {
        lines.push(`  - 🛑 null relation!`)
        continue
      }
      lines.push(`  - ${dep}`)
    }
    for (const [code, message] of warnings) {
      lines.push(`Warning ${code}: ${message}`)
    }
    return lines.join('\n')
  }
}

function initGap(node: Node) {
  switch (node.gap.scalarType) {
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
        node.gap.setSolver(node.isHorizontal ? solvers.relativeToSizeX : solvers.relativeToSizeY)
      }
      break

    case ScalarType.OppositeRelative:
      if (node.normalSizeFitContent) {
        // If the node is horizontal and its height is fit-content, the gap is treated as 0.
        node.gap.invalid(Warnings.RelativeToFitContent)
      } else {
        node.gap.setSolver(node.isHorizontal ? solvers.relativeToSizeY : solvers.relativeToSizeX)
      }
      break

    case ScalarType.LargerRelative:
    case ScalarType.SmallerRelative:
      if (node.tangentSizeFitContent && node.normalSizeFitContent) {
        node.gap.invalid(Warnings.RelativeToFitContent)
      } else {
        if (node.tangentSizeFitContent) {
          node.gap.invalid(Warnings.RelativeToFitContent)
        } else {
          node.gap
            .setSolver(node.space.gap.type === ScalarType.LargerRelative
              ? solvers.relativeToSizeMaxXY
              : solvers.relativeToSizeMinXY)
        }
        if (node.normalSizeFitContent) {
          node.gap.invalid(Warnings.RelativeToFitContent)
        } else {
          node.gap
            .setSolver(node.space.gap.type === ScalarType.LargerRelative
              ? solvers.relativeToSizeMaxXY
              : solvers.relativeToSizeMinXY)
        }
      }
      break
  }
}

function initPadding(node: Node, prop: RelativeProperty, propIsHorizontal: boolean) {
  switch (prop.scalarType) {
    case ScalarType.Absolute:
    case ScalarType.Auto: // Auto is treated as absolute for padding.
      prop.absolute(prop.scalarValue)
      break

    case ScalarType.Fraction:
    case ScalarType.Relative: {
      const fitContent = propIsHorizontal ? node.sizeXFitContent : node.sizeYFitContent
      if (fitContent) {
        prop.invalid(Warnings.RelativeToFitContent)
      } else {
        prop.setSolver(node.isHorizontal ? solvers.relativeToSizeX : solvers.relativeToSizeY)
      }
      break
    }

    case ScalarType.OppositeRelative: {
      const oppositeFitContent = propIsHorizontal ? node.sizeYFitContent : node.sizeXFitContent
      if (oppositeFitContent) {
        prop.invalid(Warnings.RelativeToFitContent)
      } else {
        prop.setSolver(node.isHorizontal ? solvers.relativeToSizeY : solvers.relativeToSizeX)
      }
      break
    }

    case ScalarType.LargerRelative:
    case ScalarType.SmallerRelative: {
      const fitContent = node.sizeXFitContent || node.sizeYFitContent
      if (fitContent) {
        prop.invalid(Warnings.RelativeToFitContent)
      } else {
        prop.setSolver(prop.scalarType === ScalarType.LargerRelative
          ? solvers.relativeToSizeMaxXY
          : solvers.relativeToSizeMinXY)
      }
      break
    }
  }
}

function initSize(node: Node, prop: RelativeProperty, innerProp: RelativeProperty, sizeIsHorizontal: boolean) {
  if (prop.scalarType === ScalarType.Absolute) {
    prop.absolute(prop.scalarValue)
    innerProp.setSolver(sizeIsHorizontal ? solvers.removePaddingFromSizeX : solvers.removePaddingFromSizeY)
    return
  }

  const sizeIsTangent = sizeIsHorizontal === node.parent?.isHorizontal
  const sizeFitContent = sizeIsHorizontal ? node.sizeXFitContent : node.sizeYFitContent

  if (sizeFitContent) {
    innerProp.setSolver(sizeIsHorizontal === node.isHorizontal ? solvers.fitContentTangent : solvers.fitContentNormal)
    // The size property of a fit-content node is derived from the inner size plus padding.
    prop.setSolver(sizeIsHorizontal ? solvers.addPaddingToInnerSizeX : solvers.addPaddingToInnerSizeY)
    return
  }

  // Inner size property derives from the size
  innerProp.setSolver(sizeIsHorizontal ? solvers.removePaddingFromSizeX : solvers.removePaddingFromSizeY)

  const { parent } = node

  if (parent === null) {
    prop.invalid(Warnings.RelativeToParentButNoParent)
    return
  }

  if (prop.isFractional) {
    prop.setSolver(solvers.waiting)
    return
  }

  /**
   * Should we use the parent inner size as reference for relative values instead of the parent size?
   */
  const relativeToParentInnerSize =
    node.isFlow || (node.isFlow === false && node.absoluteSpacingMode === 1)

  if (sizeIsTangent === false) {
    switch (prop.scalarType) {
      case ScalarType.Auto:
      case ScalarType.Fraction:
        let solverSizeX: Solver, solverSizeY: Solver
        if (relativeToParentInnerSize) {
          solverSizeX = solvers.copyParentInnerSizeX
          solverSizeY = solvers.copyParentInnerSizeY
        } else {
          solverSizeX = solvers.copyParentSizeX
          solverSizeY = solvers.copyParentSizeY
        }

        // Auto and Fraction values for the normal size are treated as relative to the parent inner size, since they have no sense otherwise.
        prop.setSolver(sizeIsHorizontal ? solverSizeX : solverSizeY)
        return
    }
  }

  let solverSizeX: Solver
  let solverSizeY: Solver
  let solverSizeMinXY: Solver
  let solverSizeMaxXY: Solver
  if (relativeToParentInnerSize) {
    solverSizeX = solvers.relativeToParentInnerSizeX
    solverSizeY = solvers.relativeToParentInnerSizeY
    solverSizeMinXY = solvers.relativeToParentInnerSizeMinXY
    solverSizeMaxXY = solvers.relativeToParentInnerSizeMaxXY
  } else {
    solverSizeX = solvers.relativeToParentSizeX
    solverSizeY = solvers.relativeToParentSizeY
    solverSizeMinXY = solvers.relativeToParentSizeMinXY
    solverSizeMaxXY = solvers.relativeToParentSizeMaxXY
  }

  switch (prop.scalarType) {
    case ScalarType.Auto:
    case ScalarType.Fraction:
    case ScalarType.Relative:
      prop.setSolver(sizeIsHorizontal ? solverSizeX : solverSizeY)
      break

    case ScalarType.OppositeRelative:
      prop.setSolver(sizeIsHorizontal ? solverSizeY : solverSizeX)
      break

    case ScalarType.LargerRelative:
    case ScalarType.SmallerRelative:
      prop.setSolver(prop.scalarType === ScalarType.LargerRelative
        ? solverSizeMaxXY
        : solverSizeMinXY)
      break
  }
}

function initConstrainedAspect(node: Node) {
  if (node.space.aspect === null)
    return

  const xAuto = node.sizeXFitContent === false && node.size_x.scalarType === ScalarType.Auto
  const yAuto = node.sizeYFitContent === false && node.size_y.scalarType === ScalarType.Auto

  if (xAuto === false && yAuto === false)
    return

  if (xAuto && yAuto === false) {
    node.size_x.setSolver(solvers.applyAspectToSizeXFromSizeY)
    node.size_x.isFractional = false
  }

  if (xAuto === false && yAuto) {
    node.size_y.setSolver(solvers.applyAspectToSizeYFromSizeX)
    node.size_y.isFractional = false
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
  treeId = Node.nextId++

  space: Space
  isHorizontal: boolean

  // TODO: remove flowChildren and detachedChildren, and instead precompute flow count (for gap calculation) to avoid allocating arrays here (reduce GC pressure & state management complexity).
  flowChildren = <Node[]>[]
  detachedChildren = <Node[]>[]

  isFlow: boolean
  sizeXFitContent: boolean
  sizeYFitContent: boolean
  tangentSizeFitContent: boolean
  normalSizeFitContent: boolean

  hasFlowChildren = false
  flowHasBeenResolved = false

  pad_px: RelativeProperty
  pad_nx: RelativeProperty
  pad_py: RelativeProperty
  pad_ny: RelativeProperty

  gap: RelativeProperty

  size_x: RelativeProperty
  size_y: RelativeProperty

  inner_size_x: RelativeProperty
  inner_size_y: RelativeProperty

  aspect: number
  sqrtAspect: number
  isAspect: boolean
  /**
   * "aspect-auto" nodes are the nodes that have an aspect ratio and both their width and height are free (auto).
   */
  isAspectAuto: boolean
  isAspectWithConstraintX: boolean
  isAspectWithConstraintY: boolean
  hasAspectAutoChildren = false

  absoluteSpacingMode: number

  remainingSignedSpace = 0

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
      && space.sizeXFitContent === false
      && (space.sizeX.type === ScalarType.Fraction || space.sizeX.type === ScalarType.Auto)
      && space.parent?.direction === Direction.Horizontal
    this.size_x = new RelativeProperty(this, PropertyType.SizeX, space.sizeX, isFractionalSizeX)

    const isFractionalSizeY = space.positioning === Positioning.Flow
      && space.sizeYFitContent === false
      && (space.sizeY.type === ScalarType.Fraction || space.sizeY.type === ScalarType.Auto)
      && space.parent?.direction === Direction.Vertical
    this.size_y = new RelativeProperty(this, PropertyType.SizeY, space.sizeY, isFractionalSizeY)

    this.inner_size_x = new RelativeProperty(this, PropertyType.InnerSizeX, space.sizeX)
    this.inner_size_y = new RelativeProperty(this, PropertyType.InnerSizeY, space.sizeY)

    const freeSizeX = this.sizeXFitContent === false && this.size_x.scalarType === ScalarType.Auto
    const freeSizeY = this.sizeYFitContent === false && this.size_y.scalarType === ScalarType.Auto
    this.isAspect = space.aspect !== null
    this.isAspectAuto = this.isAspect && freeSizeX && freeSizeY
    this.isAspectWithConstraintX = this.isAspect && freeSizeX && !freeSizeY
    this.isAspectWithConstraintY = this.isAspect && !freeSizeX && freeSizeY
    this.aspect = space.aspect ?? -1
    this.sqrtAspect = this.isAspect ? Math.sqrt(this.aspect) : -1

    this.absoluteSpacingMode = space.selfAbsoluteSpacingMode ?? space.parent?.childrenAbsoluteSpacingMode ?? 0
  }

  initialize(): this {
    this.hasAspectAutoChildren = this.children.some(child => child.isAspectAuto)

    initGap(this)
    initPadding(this, this.pad_nx, true)
    initPadding(this, this.pad_px, true)
    initPadding(this, this.pad_ny, false)
    initPadding(this, this.pad_py, false)
    initSize(this, this.size_x, this.inner_size_x, true)
    initSize(this, this.size_y, this.inner_size_y, false)
    initConstrainedAspect(this)

    for (const child of this.children) {
      if (child.isFlow)
        this.hasFlowChildren = true

      child.initialize()
    }
    this.flowHasBeenResolved = !this.hasFlowChildren

    return this
  }

  tryResolveProperties(): boolean {
    let allResolved = true
    for (const prop of this.relativeProperties()) {
      const resolved = prop.tryResolve()
      if (resolved === false) {
        allResolved = false
      }
    }
    return allResolved
  }

  /**
   * Fractional sizes cannot be resolved separately since they depend on each other.
   * 
   * This method is responsible for resolving fractional sizes once all non-fractional sizes have been resolved.
   */
  tryResolveFlow(): boolean {
    if (this.flowHasBeenResolved)
      return true

    if (this.gap.resolved === false)
      return false

    // "aspect-auto children" are children that have an aspect ratio but both their width and height are free (auto).
    if (this.hasAspectAutoChildren && this.inner_size_x.resolved === false && this.inner_size_y.resolved === false)
      return false

    const is_h = this.isHorizontal
    const inner_size = is_h ? this.inner_size_x : this.inner_size_y

    if (inner_size.resolved === false)
      return false

    const totalSpace = inner_size.value

    let hasFractionalSize = false
    let totalFraction = 0
    let totalSize = 0
    let totalAspectAutoCount = 0
    let childCount = 0

    for (const child of this.children) {
      if (child.isFlow === false)
        continue

      const childSize = is_h ? child.size_x : child.size_y
      if (child.isAspectAuto) {
        totalAspectAutoCount++
      }

      else if (childSize.isFractional) {
        hasFractionalSize = true
        totalFraction += childSize.scalarValue
      }

      else {
        if (!childSize.resolved)
          return false
        totalSize += childSize.value
      }

      childCount++
    }

    const gap = this.gap.value * Math.max(0, childCount - 1)
    let remainingSignedSpace = totalSpace - totalSize - gap
    let remainingClampedSpace = Math.max(0, remainingSignedSpace)

    // "Aspect Auto" handling:
    if (totalAspectAutoCount > 0) {
      let w_sum = 0
      let w_max = 0
      let h_sum = 0
      let h_max = 0
      for (const child of this.children) {
        if (child.isFlow === false || child.isAspectAuto === false)
          continue

        const w = child.sqrtAspect
        const h = 1 / child.sqrtAspect
        w_sum += w
        w_max = w > w_max ? w : w_max
        h_sum += h
        h_max = h > h_max ? h : h_max
      }

      const aspect_space = remainingClampedSpace * totalAspectAutoCount / (totalFraction + totalAspectAutoCount)
      const w_avail = is_h ? aspect_space : this.inner_size_x.value
      const h_avail = is_h ? this.inner_size_y.value : aspect_space

      const scale_w = is_h ? w_avail / w_sum : w_avail / w_max
      const scale_h = is_h ? h_avail / h_max : h_avail / h_sum
      const scale = Math.min(scale_w, scale_h)

      let child_w_sum = 0
      let child_h_sum = 0

      for (const child of this.children) {
        if (child.isFlow === false || child.isAspectAuto === false)
          continue

        const child_w = scale * child.sqrtAspect
        const child_h = scale / child.sqrtAspect
        child.size_x.resolve(child_w)
        child.size_y.resolve(child_h)
        child_w_sum += child_w
        child_h_sum += child_h
        remainingSignedSpace -= is_h ? child_w : child_h
      }

      // Consume the space taken by aspect-only children from the remaining space for fractional children.
      remainingClampedSpace -= is_h ? child_w_sum : child_h_sum
    }



    if (hasFractionalSize && totalFraction === 0)
      throw new InternalError('Total fraction cannot be 0 when resolving fractional sizes.')

    for (const child of this.children) {
      if (child.isFlow === false)
        continue

      if (child.isAspectAuto)
        continue

      const childSize = is_h ? child.size_x : child.size_y
      if (childSize.isFractional) {
        const resolvedSize = remainingClampedSpace * childSize.scalarValue / totalFraction
        childSize.resolve(resolvedSize)

        if (child.space.aspect !== null) {
          const aspect = child.space.aspect
          const otherSize = is_h ? child.size_y : child.size_x
          otherSize.resolve(resolvedSize / aspect)
        }

        remainingSignedSpace -= resolvedSize
      }
    }

    this.remainingSignedSpace = remainingSignedSpace
    this.flowHasBeenResolved = true
    return true
  }

  * relativeProperties(): Generator<RelativeProperty> {
    yield this.gap
    yield this.pad_ny
    yield this.pad_py
    yield this.pad_nx
    yield this.pad_px

    if (this.sizeXFitContent) {
      yield this.inner_size_x
      yield this.size_x
    } else {
      yield this.size_x
      yield this.inner_size_x
    }

    if (this.sizeYFitContent) {
      yield this.inner_size_y
      yield this.size_y
    } else {
      yield this.size_y
      yield this.inner_size_y
    }
  }

  *dependencies(): Generator<[RelativeProperty, RelativeProperty]> {
    for (const value of this.relativeProperties()) {
      if (value.resolved === false) {
        for (const relation of value.dependencies) {
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

  toDependenciesString(): string {
    const lines = [] as string[]
    let dependenciesCount = 0
    for (const prop of this.relativeProperties()) {
      lines.push(`- ${prop}`)
      dependenciesCount += prop.dependencies.length
      for (const dep of prop.dependencies) {
        lines.push(`  - ${dep}`)
      }
    }
    if (dependenciesCount === 0) {
      return `Node #${this.treeId} has no dependencies. ✅`
    }
    return [
      `Node #${this.treeId} dependencies (${dependenciesCount}):`,
      ...lines,
    ].join('\n')
  }

  toUnresolvedDependenciesString(): string {
    const lines = [] as string[]
    let dependenciesCount = 0
    for (const prop of this.relativeProperties()) {
      if (prop.resolved)
        continue
      lines.push(`- [${PropertyType[prop.type]} "${prop.solver.name}"] (${prop.dependencies.length}):`)
      dependenciesCount += prop.dependencies.length
      for (const relation of prop.dependencies) {
        lines.push(`  - [#${relation.node.treeId} ${PropertyType[relation.type]} ${relation.resolved ? '✅' : '🔶'}]`)
      }
    }
    if (dependenciesCount === 0) {
      return `Node #${this.treeId} has no unresolved dependencies. ✅`
    }
    return [
      `Node #${this.treeId} unresolved dependencies (${dependenciesCount}):`,
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
          lines.push(`${prop}`)
          for (const dep of prop.dependencies)
            lines.push(`• ${dep}`)
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
      (prop: RelativeProperty) => prop.dependencies.filter(p => {
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

/**
 * Notes:
 * - A huge optimization opportunity would be to compute the topological sort of the dependency graph to minimize the number of passes.
 */
function sizePass(stack: Node[]) {
  const nextStack = [] as Node[]

  let pass = 0
  let passMax = stack.length * 4 // Arbitrary heuristic (Up/Down/Up again). The actual number of passes is usually much lower, but this prevents infinite loops in case of unexpected circular dependencies.
  while (stack.length > 0) {
    if (pass++ > passMax) {
      console.log(K.red('Max pass count reached. Possible circular dependency.'))
      break
    }

    const node = stack.pop()!

    const propertiesResolved = node.tryResolveProperties()

    const flowResolved = node.tryResolveFlow()

    if (propertiesResolved === false || flowResolved === false)
      nextStack.push(node)

    if (stack.length === 0) {
      if (pass % 2 === 1) {
        // Normal order on odd passes.
        for (const n of nextStack) {
          stack.push(n)
        }
      } else {
        // Reversed nextStack to optimize passes:
        // - Top-down on the first pass, which is more likely to resolve root dependencies first.
        // - Bottom-up on the next passes, which is more likely to resolve leaf dependencies first.
        for (let i = nextStack.length - 1; i >= 0; i--) {
          stack.push(nextStack[i])
        }
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
    const inner_sx = node.inner_size_x.value
    const inner_sy = node.inner_size_y.value
    // Horizontal:
    if (node.isHorizontal) {
      x += node.remainingSignedSpace * node.space.flowAlignX
      for (const child of node.children) {
        if (child.isFlow) {
          child.x = x
          child.y = y + (inner_sy - child.size_y.value) * (child.space.alignY ?? node.space.flowAlignY)
          x += child.size_x.value + node.gap.value
        }
      }
    }
    // Vertical:
    else {
      y += node.remainingSignedSpace * node.space.flowAlignY
      for (const child of node.children) {
        if (child.isFlow) {
          child.x = x + (inner_sx - child.size_x.value) * (child.space.alignX ?? node.space.flowAlignX)
          child.y = y
          y += child.size_y.value + node.gap.value
        }
      }
    }
  }
  {
    // Absolute:
    for (const child of node.children) {
      if (child.isFlow)
        continue

      // Absolute spacing mode:

      // 0 :
      // No parent spacing is applied, the child is positioned solely based on its own offset and alignment.
      const sm = child.absoluteSpacingMode
      if (sm === 0) {
        const off_x = child.space.offsetX.compute(node.size_x.value, node.size_y.value)
        const off_y = child.space.offsetY.compute(node.size_y.value, node.size_x.value)

        const a_x = (child.space.alignX ?? .5) * (node.size_x.value - child.size_x.value)
        const a_y = (child.space.alignY ?? .5) * (node.size_y.value - child.size_y.value)

        child.x = node.x + off_x + a_x
        child.y = node.y + off_y + a_y
      }

      // 1 :
      // Parent spacing is applied as an offset to the child, in addition to the child's own offset and alignment.
      else {
        const parent_pad_x = node.pad_nx.value
        const parent_pad_y = node.pad_ny.value

        const off_x = child.space.offsetX.compute(node.inner_size_x.value, node.inner_size_y.value)
        const off_y = child.space.offsetY.compute(node.inner_size_y.value, node.inner_size_x.value)

        const a_x = (child.space.alignX ?? node.space.flowAlignX) * (node.inner_size_x.value - child.size_x.value)
        const a_y = (child.space.alignY ?? node.space.flowAlignY) * (node.inner_size_y.value - child.size_y.value)

        child.x = node.x + off_x + a_x + parent_pad_x
        child.y = node.y + off_y + a_y + parent_pad_y
      }
    }
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

/**
 * Computes the layout for a given space and its children, returning the root layout node with computed positions and sizes.
 * 
 * Notes:
 * - The optional `rootRect` parameter can be used to compute partial layouts for subtrees.
 */
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

  const stack = [...root.flat()]

  processCircularDependencies(stack)

  sizePass(stack)

  positionPass(root)

  applyLayout(root)

  return root
}
