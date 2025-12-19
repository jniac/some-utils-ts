import { ScalarDeclaration } from './Scalar'

enum All {
  // Positioning:
  Flow,
  Detached,

  // Direction:
  Horizontal,
  Vertical,
}

export enum Direction {
  Horizontal = All.Horizontal,
  Vertical = All.Vertical,
}

export enum Positioning {
  /**
   * Flow children are included in the layout computation. They are positioned
   * relative to the parent space and to other children (previous children offset).
   */
  Flow = All.Flow,
  /**
   * Detached children are not included in the layout computation. They are 
   * positioned relative to the parent space only (not to other children).
   */
  Detached = All.Detached,
}

export enum AspectSizeMode {
  Contain = 'contain',
  Cover = 'cover',
  FillTangentSpace = 'fill-tangent-space',
  FillNormalSpace = 'fill-normal-space',
}

export type AspectSizeModeDeclaration =
  | AspectSizeMode
  | `${AspectSizeMode}`

export function parseAspectSizeMode(value: any): AspectSizeMode {
  if (value in AspectSizeMode) {
    return value
  }
  if (typeof value === 'string') {
    for (const mode of Object.values(AspectSizeMode)) {
      if (value === mode) {
        return mode
      }
    }
  }
  throw new Error(`Invalid aspect size mode value: ${value}`)
}


// Declaration & parsing:

export type PositioningDeclaration =
  | Positioning
  | 'flow'
  | 'detached'

export function parsePositioning(value: any): Positioning {
  if (value in Positioning) {
    return value
  }
  if (typeof value === 'string') {
    return value === 'flow'
      ? Positioning.Flow
      : Positioning.Detached
  }
  throw new Error(`Invalid positioning value: ${value}`)
}

export type DirectionDeclaration =
  | Direction
  | boolean
  | 'horizontal'
  | 'vertical'

export function parseDirection(value: any): Direction {
  if (typeof value === 'boolean') {
    return value ? Direction.Horizontal : Direction.Vertical
  }
  if (value in Direction) {
    return value
  }
  if (typeof value === 'string') {
    return value === 'horizontal'
      ? Direction.Horizontal
      : Direction.Vertical
  }
  throw new Error(`Invalid direction value: ${value}`)
}

export type SizeDeclaration =
  | ScalarDeclaration
  | [width: ScalarDeclaration, height: ScalarDeclaration]
  | { width: ScalarDeclaration, height: ScalarDeclaration }


