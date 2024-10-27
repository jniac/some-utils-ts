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
      if (side.type === ScalarType.Share) {
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

const _innerRect = new Rectangle()
/**
 * Compute the rect of all children of a space.
 * 
 * It assumes that the rect of the space itself has already been computed.
 */
export function computeChildrenRect(space: Space) {
  const { direction, alignX, alignY } = space
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

  const { x, y, width, height } = _innerRect
    .copy(space.rect)
    .applyPadding(computePadding(space))
  const gap = space.gap.compute(width, height)

  const [detachedChildren, flowChildren, regularChildren, shareChildren, totalShare] = enabledChildren.reduce((acc, child) => {
    if (child.positioning === Positioning.Detached) {
      acc[0].push(child)
    } else {
      acc[1].push(child) // Flow
      const size = direction === Direction.Horizontal
        ? child.sizeX
        : child.sizeY
      if (size.type !== ScalarType.Share) {
        acc[2].push(child)
      } else {
        acc[3].push(child)
        acc[4] += size.value
      }
    }
    return acc
  }, [[], [], [], [], 0] as [Space[], Space[], Space[], Space[], number])

  // Detached children
  for (const child of detachedChildren) {
    const w = child.sizeX.compute(width, height)
    const h = child.sizeY.compute(height, width)
    child.rect.width = child.extraSizeX.compute(w, h)
    child.rect.height = child.extraSizeY.compute(h, w)
    const innerWidth = width - child.rect.width
    const innerHeight = height - child.rect.height
    child.rect.x = x + child.offsetX.compute(innerWidth, innerHeight)
    child.rect.y = y + child.offsetY.compute(innerHeight, innerWidth)
  }

  let cumulative = 0

  // Regular children
  if (direction === Direction.Horizontal) {
    for (const child of regularChildren) {
      const w = child.sizeX.compute(width, height)
      const h = child.sizeY.compute(height, width)
      child.rect.width = child.extraSizeX.compute(w, h)
      child.rect.height = child.extraSizeY.compute(h, w)
      cumulative += w
    }
  } else {
    for (const child of regularChildren) {
      const w = child.sizeX.compute(width, height)
      const h = child.sizeY.compute(height, width)
      child.rect.width = child.extraSizeX.compute(w, h)
      child.rect.height = child.extraSizeY.compute(h, w)
      cumulative += h
    }
  }

  // Share children
  const shareRemaining = (direction === Direction.Horizontal ? width : height)
    - cumulative
    - Math.max(0, flowChildren.length - 1) * gap
  const shareSize = shareRemaining > 0
    ? shareRemaining / totalShare : 0
  if (direction === Direction.Horizontal) {
    for (const child of shareChildren) {
      const w = shareSize * child.sizeX.value
      const h = child.sizeY.compute(height, width)
      child.rect.width = child.extraSizeX.compute(w, h)
      child.rect.height = child.extraSizeY.compute(h, w)
    }
  } else {
    for (const child of shareChildren) {
      const w = child.sizeX.compute(width, height)
      const h = shareSize * child.sizeY.value
      child.rect.width = child.extraSizeX.compute(w, h)
      child.rect.height = child.extraSizeY.compute(h, w)
    }
  }

  let finalRemaining = 0
  if (direction === Direction.Horizontal) {
    finalRemaining = width - Math.max(0, flowChildren.length - 1) * gap
    for (const child of flowChildren) {
      finalRemaining -= child.rect.width
    }
  } else {
    finalRemaining = height - Math.max(0, flowChildren.length - 1) * gap
    for (const child of flowChildren) {
      finalRemaining -= child.rect.height
    }
  }

  if (direction === Direction.Horizontal) {
    let cumulative = _innerRect.x + finalRemaining * alignX
    for (const child of flowChildren) {
      const offx = child.offsetX.compute(child.rect.width, child.rect.height)
      const offy = child.offsetY.compute(child.rect.height, child.rect.width)
      child.rect.x = offx + cumulative
      child.rect.y = offy + _innerRect.y + (_innerRect.height - child.rect.height) * alignY
      cumulative += child.rect.width + gap
    }
  } else {
    let cumulative = _innerRect.y + finalRemaining * alignY
    for (const child of flowChildren) {
      const offx = child.offsetX.compute(child.rect.width, child.rect.height)
      const offy = child.offsetY.compute(child.rect.height, child.rect.width)
      child.rect.x = offx + _innerRect.x + (_innerRect.width - child.rect.width) * alignX
      child.rect.y = offy + cumulative
      cumulative += child.rect.height + gap
    }
  }
}
