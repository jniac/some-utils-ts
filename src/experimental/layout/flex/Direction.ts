
export enum Direction {
  Horizontal,
  Vertical,
}

export type DirectionDeclaration =
  | Direction
  | 'horizontal'
  | 'vertical'

export function parseDirection(value: DirectionDeclaration): Direction {
  if (typeof value === 'string') {
    return value === 'horizontal'
      ? Direction.Horizontal
      : Direction.Vertical
  }
  return value
}