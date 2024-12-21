
// https://www.desmos.com/calculator/swfqlnlhu9

const clamp01 = (x: number) => x < 0 ? 0 : x > 1 ? 1 : x

export const computeMidBase = (m: number): number => {
  m = 1 / m - 1
  return m * m
}

export const mid = (x: number, m: number): number => {
  const b = computeMidBase(m)
  return (b ** x - 1) / (b - 1)
}

export const midInverse = (x: number, m: number): number => {
  const b = computeMidBase(m)
  return Math.log(x * (b - 1) + 1) / Math.log(b)
}

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
export const interpolateWithMidPoint = (min: number, max: number, midValue: number, t: number) => {
  const d = max - min
  const m = (midValue - min) / d
  if (m <= 0 || m >= 1) {
    // Invalid "mid" value, lerp fallback
    return min + d * clamp01(t)
  }
  return min + d * mid(clamp01(t), m)
}

/**
 * Same as {@link interpolateWithMidPoint} but without clamp.
 */
export const interpolateWithMidPointUnclamped = (min: number, max: number, midValue: number, t: number) => {
  const d = max - min
  const m = (midValue - min) / d
  if (m <= 0 || m >= 1) {
    // Invalid "mid" value, lerp fallback
    return min + d * t
  }
  return min + d * mid(t, m)
}

/**
 * Returns the original `t` value from the range, the "mid" value and an interpolated value.
 */
export const inverseInterpolateWithMidPoint = (min: number, max: number, midValue: number, x: number) => {
  const d = max - min
  const m = (midValue - min) / d
  const t = clamp01((x - min) / d)
  if (m <= 0 || m >= 1) {
    // Invalid "mid" value, lerp fallback
    return t
  }
  return midInverse(t, m)
}

/**
 * Same as {@link inverseInterpolateWithMidPoint} but without clamp.
 */
export const inverseInterpolateWithMidPointUnclamped = (min: number, max: number, midValue: number, x: number) => {
  const d = max - min
  const m = (midValue - min) / d
  const t = (x - min) / d
  if (m <= 0 || m >= 1) {
    // Invalid "mid" value, lerp fallback
    return t
  }
  return midInverse(t, m)
}