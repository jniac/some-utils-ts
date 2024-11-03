import { split } from '../../../iteration/high-order'
import { Padding } from '../../../math/geom/padding'
import { Rectangle } from '../../../math/geom/rectangle'
import { ScalarType } from './Scalar'
import { Space } from './Space'
import { Direction, Positioning } from './types'

export function computeRootRect(space: Space) {
  const { offsetX, offsetY, sizeX, sizeY } = space

  {
    // Check
    for (const scalar of [offsetX, offsetY, sizeX, sizeY]) {
      if (scalar.type !== ScalarType.Absolute) {
        throw new Error('Root space must have absolute offset and size')
      }
    }
  }

  space.rect.set(
    offsetX.value,
    offsetY.value,
    sizeX.value,
    sizeY.value)
}

const _padding = new Padding()
export function computePadding(space: Space) {
  const { width: w, height: h } = space.rect

  {
    // Check
    for (const side of space.padding) {
      if (side.type === ScalarType.Fraction) {
        throw new Error('Share padding is not allowed')
      }
    }
  }

  return _padding.setTRBL(
    space.padding[0].compute(h, w),
    space.padding[1].compute(w, h),
    space.padding[2].compute(h, w),
    space.padding[3].compute(w, h))
}

const _childrenMargins = <Padding[]>[]
function computeChildrenMargins(space: Space) {
  while (_childrenMargins.length < space.children.length) {
    _childrenMargins.push(new Padding())
  }
  const { width: w, height: h } = space.rect
  for (let i = 0; i < space.children.length; i++) {
    const child = space.children[i]
    _childrenMargins[i].setTRBL(
      child.margin[0].compute(h, w),
      child.margin[1].compute(w, h),
      child.margin[2].compute(h, w),
      child.margin[3].compute(w, h))
  }
}

function computeSize(space: Space, width: number, height: number, direction: Direction, margin: Padding) {
  let w = 0, h = 0
  if (direction === Direction.Horizontal && (space.sizeX.type === ScalarType.Auto || space.sizeX.type === ScalarType.Fraction)) {
    const marginStart = Math.max(0, margin.top - _padding.top)
    const marginEnd = Math.max(0, margin.bottom - _padding.bottom)
    height = Math.max(0, height - marginStart - marginEnd)
  }
  if (direction === Direction.Vertical && (space.sizeY.type === ScalarType.Auto || space.sizeY.type === ScalarType.Fraction)) {
    const marginStart = Math.max(0, margin.left - _padding.left)
    const marginEnd = Math.max(0, margin.right - _padding.right)
    width = Math.max(0, width - marginStart - marginEnd)
  }
  if (space.aspect !== null) {
    let useWidth = false
    if (space.sizeX.type === ScalarType.Auto) {
      if (space.sizeY.type === ScalarType.Auto) {
        useWidth = direction === Direction.Horizontal
      } else {
        useWidth = true
      }
    } else {
      if (space.sizeY.type === ScalarType.Auto) {
        useWidth = false
      } else {
        throw new Error('When aspect ratio is defined, at least one of the sizeX or sizeY must be "auto"')
      }
    }
    if (useWidth) {
      w = space.sizeX.compute(width, height)
      h = w / space.aspect
    } else {
      h = space.sizeY.compute(height, width)
      w = h * space.aspect
    }
  } else {
    w = space.sizeX.compute(width, height)
    h = space.sizeY.compute(height, width)
  }
  space.rect.width = space.extraSizeX.compute(w, h)
  space.rect.height = space.extraSizeY.compute(h, w)
}

const _innerRect = new Rectangle()

/**
 * Compute the rect of all children of a space.
 * 
 * It assumes that the rect of the space itself has already been computed.
 */
export function computeChildrenRect(space: Space) {
  const { direction, alignChildrenX, alignChildrenY } = space
  const [enabledChildren, disabledChildren] = split(space.children, child => child.enabled ? 0 : 1)

  if (disabledChildren) {
    for (const child of disabledChildren) {
      // Do not forget to reset the rect of all descendants (and not only the child itself).
      for (const descendant of child.allDescendants({ includeSelf: true })) {
        descendant.rect.set(0, 0, 0, 0)
      }
    }
  }

  if (enabledChildren === undefined) {
    return
  }

  computePadding(space)

  const {
    x: innerX,
    y: innerY,
    width: innerWidth,
    height: innerHeight,
  } = _innerRect
    .copy(space.rect)
    .applyPadding(_padding)
  const gap = space.gap.compute(innerWidth, innerHeight)

  // flowChildren = regularChildren + shareChildren
  const [detachedChildren, flowChildren, regularChildren, fractionChildren, totalFraction] = enabledChildren.reduce((acc, child) => {
    if (child.positioning === Positioning.Detached) {
      acc[0].push(child)
    } else {
      acc[1].push(child) // Flow
      const size = direction === Direction.Horizontal
        ? child.sizeX
        : child.sizeY
      if (size.type !== ScalarType.Fraction && size.type !== ScalarType.Auto) {
        acc[2].push(child)
      } else {
        acc[3].push(child)
        acc[4] += size.value
      }
    }
    return acc
  }, [<Space[]>[], <Space[]>[], <Space[]>[], <Space[]>[], 0])

  computeChildrenMargins(space)

  // Compute the "tangent" spacing between children
  const tangentSpacings = Array.from({ length: flowChildren.length + 1 }) as number[]
  let cumulativeTangentSpacing = 0, spacing = 0
  if (direction === Direction.Horizontal) {
    // Horizontal: left, right
    spacing = Math.max(_childrenMargins[0].left, _padding.left)
    cumulativeTangentSpacing += spacing
    tangentSpacings[0] = spacing
    for (let i = 1, n = flowChildren.length; i < n; i++) {
      spacing = Math.max(_childrenMargins[i - 1].right, _childrenMargins[i].left, gap)
      cumulativeTangentSpacing += spacing
      tangentSpacings[i] = spacing
    }
    if (flowChildren.length > 0) {
      spacing = Math.max(_childrenMargins[flowChildren.length - 1].right, _padding.right)
      cumulativeTangentSpacing += spacing
      tangentSpacings[flowChildren.length] = spacing
    }
  }

  else {
    // Vertical: top, bottom
    spacing = Math.max(_childrenMargins[0].top, _padding.top)
    cumulativeTangentSpacing += spacing
    tangentSpacings[0] = spacing
    for (let i = 1, n = flowChildren.length; i < n; i++) {
      spacing = Math.max(_childrenMargins[i - 1].bottom, _childrenMargins[i].top, gap)
      cumulativeTangentSpacing += spacing
      tangentSpacings[i] = spacing
    }
    if (flowChildren.length > 0) {
      spacing = Math.max(_childrenMargins[flowChildren.length - 1].bottom, _padding.bottom)
      cumulativeTangentSpacing += spacing
      tangentSpacings[flowChildren.length] = spacing
    }
  }

  // Detached children
  for (const child of detachedChildren) {
    // Size
    computeSize(child, innerWidth, innerHeight, direction, _childrenMargins[0])

    // Position
    const freeWidth = innerWidth - child.rect.width
    const freeHeight = innerHeight - child.rect.height
    child.rect.x = innerX
      + freeWidth * (child.alignSelfX ?? alignChildrenX)
      + child.offsetX.compute(innerWidth, innerHeight)
    child.rect.y = innerY
      + freeHeight * (child.alignSelfY ?? alignChildrenY)
      + child.offsetY.compute(innerHeight, innerWidth)
  }

  let cumulativeSize = 0

  // Regular children
  if (direction === Direction.Horizontal) {
    for (let i = 0, n = regularChildren.length; i < n; i++) {
      const child = regularChildren[i]
      computeSize(child, innerWidth, innerHeight, direction, _childrenMargins[i])
      cumulativeSize += child.rect.width
    }
  } else {
    for (let i = 0, n = regularChildren.length; i < n; i++) {
      const child = regularChildren[i]
      computeSize(child, innerWidth, innerHeight, direction, _childrenMargins[i])
      cumulativeSize += child.rect.height
    }
  }

  // Fraction children
  const fractionRemaining = (direction === Direction.Horizontal ? space.rect.width : space.rect.height)
    - cumulativeSize
    - cumulativeTangentSpacing
  const fractionSize = fractionRemaining > 0
    ? fractionRemaining / totalFraction
    : 0
  if (direction === Direction.Horizontal) {
    for (let i = 0, n = fractionChildren.length; i < n; i++) {
      const child = fractionChildren[i]
      computeSize(child, fractionSize * child.sizeX.value, innerHeight, direction, _childrenMargins[i])
    }
  } else {
    for (let i = 0, n = fractionChildren.length; i < n; i++) {
      const child = fractionChildren[i]
      computeSize(child, innerWidth, fractionSize * child.sizeY.value, direction, _childrenMargins[i])
    }
  }

  // Compute the "final" remaining space (regular + share)
  let finalRemaining = 0
  if (direction === Direction.Horizontal) {
    finalRemaining = space.rect.width - cumulativeTangentSpacing
    for (const child of flowChildren) {
      finalRemaining -= child.rect.width
    }
  } else {
    finalRemaining = space.rect.height - cumulativeTangentSpacing
    for (const child of flowChildren) {
      finalRemaining -= child.rect.height
    }
  }

  // Compute the position of all children
  if (direction === Direction.Horizontal) {
    let cumulative = space.rect.x + tangentSpacings[0] + finalRemaining * alignChildrenX
    for (let index = 0, max = flowChildren.length; index < max; index++) {
      const child = flowChildren[index]
      const offx = child.offsetX.compute(child.rect.width, child.rect.height)
      const offy = child.offsetY.compute(child.rect.height, child.rect.width)
      child.rect.x = offx + cumulative
      if (child.sizeY.type === ScalarType.Fraction || child.sizeY.type === ScalarType.Auto) {
        const startMargin = Math.max(0, _childrenMargins[index].top - _padding.top)
        const endMargin = Math.max(0, _childrenMargins[index].bottom - _padding.bottom)
        child.rect.y = offy + _innerRect.y + startMargin + (_innerRect.height - child.rect.height - startMargin - endMargin) * (child.alignSelfY ?? alignChildrenY)
      } else {
        child.rect.y = offy + _innerRect.y + (_innerRect.height - child.rect.height) * (child.alignSelfY ?? alignChildrenY)
      }
      cumulative += child.rect.width + tangentSpacings[index + 1]
    }
  }

  else {
    let cumulative = space.rect.y + tangentSpacings[0] + finalRemaining * alignChildrenY
    for (let index = 0, max = flowChildren.length; index < max; index++) {
      const child = flowChildren[index]
      const offx = child.offsetX.compute(child.rect.width, child.rect.height)
      const offy = child.offsetY.compute(child.rect.height, child.rect.width)
      if (child.sizeX.type === ScalarType.Fraction || child.sizeX.type === ScalarType.Auto) {
        const startMargin = Math.max(0, _childrenMargins[index].left - _padding.left)
        const endMargin = Math.max(0, _childrenMargins[index].right - _padding.right)
        child.rect.x = offx + _innerRect.x + startMargin + (_innerRect.width - child.rect.width - startMargin - endMargin) * (child.alignSelfX ?? alignChildrenX)
      } else {
        child.rect.x = offx + _innerRect.x + (_innerRect.width - child.rect.width) * (child.alignSelfX ?? alignChildrenX)
      }
      child.rect.y = offy + cumulative
      cumulative += child.rect.height + tangentSpacings[index + 1]
    }
  }
}
