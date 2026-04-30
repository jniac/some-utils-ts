import { ScalarDeclaration } from './Scalar'

enum SpaceConstants {
  // Positioning:
  Flow,
  Absolute,

  // Direction:
  Horizontal,
  Vertical,
}

const SC = SpaceConstants

export enum Direction {
  Horizontal = SC.Horizontal,
  Vertical = SC.Vertical,
}

export enum Positioning {
  /**
   * Flow children are included in the layout computation. They are positioned
   * relative to the parent space and to other children (previous children offset).
   */
  Flow = SC.Flow,
  /**
   * Absolute children are not included in the layout computation. They are 
   * positioned relative to the parent space only (not to other children).
   */
  Absolute = SC.Absolute,
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
  | 'absolute'
  | 'detached' // backward compatibility

export function parsePositioning(value: any): Positioning {
  if (value in Positioning) {
    return value
  }
  if (typeof value === 'string') {
    return value === 'flow'
      ? Positioning.Flow
      : Positioning.Absolute
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

export function directionToString(direction: Direction): string {
  return direction === Direction.Horizontal ? 'horizontal' : 'vertical'
}

export function oppositeDirection(direction: Direction): Direction {
  return direction === Direction.Horizontal
    ? Direction.Vertical
    : Direction.Horizontal
}

export type SizeDeclaration =
  | ScalarDeclaration
  | [width: ScalarDeclaration, height: ScalarDeclaration]
  | { width: ScalarDeclaration, height: ScalarDeclaration }


