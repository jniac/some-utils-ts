import { Vector2Like, Vector3Like } from '../types';
export declare function clamp(x: number, min: number, max: number): number;
export declare function clamp01(x: number): number;
export declare function signedClamp(x: number, max: number): number;
export declare function lerp(a: number, b: number, x: number): number;
export declare function lerpUnclamped(a: number, b: number, x: number): number;
export declare function inverseLerp(a: number, b: number, x: number): number;
export declare function inverseLerpUnclamped(a: number, b: number, x: number): number;
export declare function exponentialLerp(a: number, b: number, t: number): number;
export declare function exponentialLerpUnclamped(a: number, b: number, t: number): number;
export declare function inverseExponentialLerp(a: number, b: number, x: number): number;
export declare function inverseExponentialLerpUnclamped(a: number, b: number, x: number): number;
export declare function remap(x: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
export declare function remapUnclamped(x: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
export declare function round(x: number, base?: number): number;
export declare function roundPowerOfTwo(x: number): number;
export declare function floor(x: number, base?: number): number;
export declare function floorPowerOfTwo(x: number): number;
export declare function ceil(x: number, base?: number): number;
export declare function ceilPowerOfTwo(x: number): number;
export declare function toff(x: number): number;
export declare function limited(x: number, limit: number): number;
export declare function signedLimited(x: number, limit: number): number;
export declare function cos01(x: number): number;
export declare function sin01(x: number): number;
export declare function euclideanDivision(n: number, d: number): [integer: number, rest: number];
/**
 * Returns the "positive" modulo of "x".
 * ```
 * positiveModulo(-2, 10) // -> 8
 * ```
 */
export declare function positiveModulo(x: number, base: number): number;
/**
 * Return an half-positive-half-negative-modulo, eg:
 * ```
 * middleModulo(190, 360) // -> -170
 * middleModulo(-190, 360) // -> 170
 * middleModulo(370, 360) // -> 10
 * ```
 */
export declare function middleModulo(x: number, modulo: number): number;
/**
 * Returns the shortest signed distance between two values.
 * ```
 * moduloDistance(10, 350, 360) // -> -20
 * moduloDistance(350, 10, 360) // -> 20
 * ```
 * NOTE: The order of the arguments matters:
 * ```
 * moduloShortestSignedDistance(a, b, cycle) !== moduloShortestSignedDistance(b, a, cycle)
 * ```
 */
export declare function moduloShortestSignedDistance(start: number, end: number, mod: number): number;
/**
 * Clamps a value with progressive limit. Useful for user "drag" feedbacks.
 * https://www.desmos.com/calculator/vssiyqze6q
 */
export declare function limitedClamp(x: number, min: number, minLimit: number, max: number, maxLimit: number): number;
/**
 * Converts a 1D index to a 2D position.
 */
export declare function index2(index: number, width: number): [x: number, y: number];
/**
 * Converts a 1D index to a 3D position.
 */
export declare function index3(index: number, width: number, height: number): [x: number, y: number, z: number];
export declare function distance2(x: number, y: number): number;
export declare function distance3(x: number, y: number, z: number): number;
export declare function distance(a: Vector2Like | Vector3Like, b: Vector2Like | Vector3Like): number;
export declare function distance(x: number, y: number, z: number): number;
export declare function normalize<T extends Vector2Like | Vector3Like>(v: T): T;
//# sourceMappingURL=basic.d.ts.map