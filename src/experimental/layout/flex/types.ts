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
  | 'horizontal'
  | 'vertical'

export function parseDirection(value: any): Direction {
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
