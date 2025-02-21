import { RectangleLike, Vector2Like, Vector3Like } from '../types';
export declare function isNumber(value: any): value is number;
export declare function isVector2Like(obj: any): obj is Vector2Like;
export { isVector2Like as isPoint2Like };
export declare function isVector3Like(obj: any): obj is Vector3Like;
export { isVector3Like as isPoint3Like };
export declare function isRectangleLike(obj: any): obj is RectangleLike;
