export declare const computeMidBase: (m: number) => number;
export declare const mid: (x: number, m: number) => number;
export declare const midInverse: (x: number, m: number) => number;
/**
 * Let's [100, 200] be a range and 110 a "mid-point", the function will return
 * - `100` for `t = 0`
 * - `110` for `t = 0.5`
 * - `200` for `t = 1`
 *
 * and
 *
 * - `100.689...` for `t = 0.1`
 * - `102.5` for `t = 0.25`
 *
 * etc.
 *
 * For reverse operation see {@link inverseInterpolateWithMidPoint}.
 */
export declare const interpolateWithMidPoint: (min: number, max: number, midValue: number, t: number) => number;
/**
 * Same as {@link interpolateWithMidPoint} but without clamp.
 */
export declare const interpolateWithMidPointUnclamped: (min: number, max: number, midValue: number, t: number) => number;
/**
 * Returns the original `t` value from the range, the "mid" value and an interpolated value.
 */
export declare const inverseInterpolateWithMidPoint: (min: number, max: number, midValue: number, x: number) => number;
/**
 * Same as {@link inverseInterpolateWithMidPoint} but without clamp.
 */
export declare const inverseInterpolateWithMidPointUnclamped: (min: number, max: number, midValue: number, x: number) => number;
