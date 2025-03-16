import { Vector2Like, Vector3Like } from '../../types';
export declare function bezier2<T extends Vector2Like>(points: T[], t: number, out?: T): T;
export declare function bezier3<T extends Vector3Like>(points: T[], t: number, out?: T): T;
/**
 * Returns Cubic Bezier control points for an arc.
 * https://pomax.github.io/bezierinfo/#circles
 */
export declare function cubicBezierArcControlPoints<T extends Vector2Like>(center: Vector2Like, radius: number, start: number, end: number, tension?: number, out?: T[]): T[];
