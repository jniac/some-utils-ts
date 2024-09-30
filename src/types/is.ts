import { RectangleLike, Vector2Like, Vector3Like } from '../types'

export function isVector2Like(obj: any): obj is Vector2Like {
  return obj && typeof obj.x === 'number' && typeof obj.y === 'number'
}

export { isVector2Like as isPoint2Like }

export function isVector3Like(obj: any): obj is Vector3Like {
  return obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.z === 'number'
}

export { isVector3Like as isPoint3Like }

export function isRectangleLike(obj: any): obj is RectangleLike {
  return obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.width === 'number' && typeof obj.height === 'number'
}
