import { Vector2Like, Vector3Like } from '../types';
export declare const clamp: (x: number, min: number, max: number) => number;
export declare const clamp01: (x: number) => number;
export declare const signedClamp: (x: number, max: number) => number;
export declare const lerp: (a: number, b: number, x: number) => number;
export declare const lerpUnclamped: (a: number, b: number, x: number) => number;
export declare const inverseLerp: (a: number, b: number, x: number) => number;
export declare const inverseLerpUnclamped: (a: number, b: number, x: number) => number;
export declare const round: (x: number, base?: number) => number;
export declare const roundPowerOfTwo: (x: number) => number;
export declare const floor: (x: number, base?: number) => number;
export declare const floorPowerOfTwo: (x: number) => number;
export declare const ceil: (x: number, base?: number) => number;
export declare const ceilPowerOfTwo: (x: number) => number;
export declare const toff: (x: number) => number;
export declare const limited: (x: number, limit: number) => number;
export declare const signedLimited: (x: number, limit: number) => number;
/**
 * Returns the "positive" modulo of "x".
 * ```
 * positiveModulo(-2, 10) // -> 8
 * ```
 */
export declare const positiveModulo: (x: number, base: number) => number;
/**
 * Return an half-positive-half-negative-modulo, eg:
 * ```
 * middleModulo(190, 360) // -> -170
 * middleModulo(-190, 360) // -> 170
 * middleModulo(370, 360) // -> 10
 * ```
 */
export declare const middleModulo: (x: number, modulo: number) => number;
/**
 * Clamps a value with progressive limit. Useful for user "drag" feedbacks.
 * https://www.desmos.com/calculator/vssiyqze6q
 */
export declare const limitedClamp: (x: number, min: number, minLimit: number, max: number, maxLimit: number) => number;
/**
 * Converts a 1D index to a 2D position.
 */
export declare const index2: (index: number, width: number) => number[];
/**
 * Converts a 1D index to a 3D position.
 */
export declare const index3: (index: number, width: number, height: number) => number[];
export declare const distance2: (x: number, y: number) => number;
export declare const distance3: (x: number, y: number, z: number) => number;
export declare function distance(a: Vector2Like | Vector3Like, b: Vector2Like | Vector3Like): number;
export declare function distance(x: number, y: number, z: number): number;
