import { Padding } from '../../../math/geom/padding'
import { Rectangle } from '../../../math/geom/rectangle'
import { Direction } from './Direction'
import { ScalarType } from './Scalar'
import { Space } from './Space'

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

const _innerRect = new Rectangle()
export function computeChildrenRect(space: Space) {
  const { direction, children, alignX, alignY } = space
  const { width, height } = _innerRect
    .copy(space.rect)
    .applyPadding(computePadding(space))
  const gap = space.gap.compute(width, height)

  const [regularChildren, shareChildren, totalShare] = children.reduce((acc, child) => {
    const size = direction === Direction.Horizontal
      ? child.sizeX
      : child.sizeY
    if (size.type !== ScalarType.Fraction) {
      acc[0].push(child)
    } else {
      acc[1].push(child)
      acc[2] += size.value
    }
    return acc
  }, [[], [], 0] as [Space[], Space[], number])

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
    - Math.max(0, children.length - 1) * gap
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
    finalRemaining = width - Math.max(0, children.length - 1) * gap
    for (const child of children) {
      finalRemaining -= child.rect.width
    }
  } else {
    finalRemaining = height - Math.max(0, children.length - 1) * gap
    for (const child of children) {
      finalRemaining -= child.rect.height
    }
  }

  if (direction === Direction.Horizontal) {
    let cumulative = _innerRect.x + finalRemaining * alignX
    for (const child of children) {
      const offx = child.offsetX.compute(child.rect.width, child.rect.height)
      const offy = child.offsetY.compute(child.rect.height, child.rect.width)
      child.rect.x = offx + cumulative
      child.rect.y = offy + _innerRect.y + (_innerRect.height - child.rect.height) * alignY
      cumulative += child.rect.width + gap
    }
  } else {
    let cumulative = _innerRect.y + finalRemaining * alignY
    for (const child of children) {
      const offx = child.offsetX.compute(child.rect.width, child.rect.height)
      const offy = child.offsetY.compute(child.rect.height, child.rect.width)
      child.rect.x = offx + _innerRect.x + (_innerRect.width - child.rect.width) * alignX
      child.rect.y = offy + cumulative
      cumulative += child.rect.height + gap
    }
  }
}
