
const clamp01 = (x: number) => x < 0 ? 0 : x > 1 ? 1 : x

export const linear = (x: number) => clamp01(x)

export const easeIn1 = linear
export const easeIn2 = (x: number) => (x = clamp01(x)) * x
export const easeIn3 = (x: number) => (x = clamp01(x)) * x * x
export const easeIn4 = (x: number) => (x = clamp01(x)) * x * x * x
export const easeIn5 = (x: number) => (x = clamp01(x)) * x * x * x * x
export const easeIn6 = (x: number) => (x = clamp01(x)) * x * x * x * x * x

export const easeOut1 = linear
export const easeOut2 = (x: number) => 1 - (x = clamp01(1 - x)) * x
export const easeOut3 = (x: number) => 1 - (x = clamp01(1 - x)) * x * x
export const easeOut4 = (x: number) => 1 - (x = clamp01(1 - x)) * x * x * x
export const easeOut5 = (x: number) => 1 - (x = clamp01(1 - x)) * x * x * x * x
export const easeOut6 = (x: number) => 1 - (x = clamp01(1 - x)) * x * x * x * x * x

/**
 * https://www.desmos.com/calculator/chosfesws4

 * @param x 
 * @param p 
 * @param i 
 * @returns 
 */
export const easeInOut = (x: number, p: number = 3, i: number = 0.5) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < i
    ? 1 / Math.pow(i, p - 1) * Math.pow(x, p)
    : 1 - 1 / Math.pow(1 - i, p - 1) * Math.pow(1 - x, p)
  )
}

export const easeInOut1 = linear

export const easeInOut2 = (x: number) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < 0.5
    ? 2 * x * x
    : 1 - 2 * (x = 1 - x) * x
  )
}

export const easeInOut3 = (x: number) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < 0.5
    ? 4 * x * x * x
    : 1 - 4 * (x = 1 - x) * x * x
  )
}

export const easeInOut4 = (x: number) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < 0.5
    ? 8 * x * x * x * x
    : 1 - 8 * (x = 1 - x) * x * x * x
  )
}

export const easeInOut5 = (x: number) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < 0.5
    ? 16 * x * x * x * x * x
    : 1 - 16 * (x = 1 - x) * x * x * x * x
  )
}

export const easeInOut6 = (x: number) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < 0.5
    ? 32 * x * x * x * x * x * x
    : 1 - 32 * (x = 1 - x) * x * x * x * x * x
  )
}

/**
 * Powerful ease function that chains together an ease-in and ease-out curves by 
 * a linear interval. The ease-in and ease-out curves use separate coefficient,
 * making very easy to transform a transition from ease in/out to a pure ease-in 
 * or ease-out.
 * 
 * The function is actually NOT optimized (could it be?) and involves from 4 to 5
 * power (to compute internal threshold, and the output when x corresponds to
 * the ease in or out phase).
 * 
 * https://jniac.github.io/some-curves/curves/ease-in-linear-ease-out/
 * https://www.desmos.com/calculator/3izcjwwok7
 * 
 * @param {number} x The current transition value from 0 to 1.
 * @param {number} p The "ease-in" coefficient.
 * @param {number} q The "ease-out" coefficient.
 * @param {number} s The "linear" proportion (0: no linear, 1: full linear)
 */
export const easeInLinearEaseOut = (x: number, p: number, q: number, s: number) => {
  const EPSILON = 1e-6
  const p1 = Math.abs(p - 1) < EPSILON ? 1 / Math.E : (1 / p) ** (1 / (p - 1))
  const q1 = Math.abs(q - 1) < EPSILON ? 1 / Math.E : (1 / q) ** (1 / (q - 1))
  const w = (p1 + q1) / (1 - s)
  const x1 = p1 / w
  const x2 = 1 - q1 / w
  const p2 = p1 ** p
  const q2 = q1 ** q
  const a = w - p1 + p2 - q1 + q2
  if (x < 0) {
    return 0
  }
  if (x > 1) {
    return 1
  }
  if (s >= 1) {
    return x
  }
  if (x < x1) {
    return ((x * w) ** p) / a
  }
  if (x > x2) {
    return 1 - (((1 - x) * w) ** q) / a
  }
  return (x * w - p1 + p2) / a
}

/**
 * "in-then-out" easing curve using a cosine function.
 * https://www.desmos.com/calculator/koudvu41xb
 */
export const inThenOutCos = (x: number) => {
  return .5 + .5 * Math.cos(2 * Math.PI * (x - .5))
}

/**
 * "in-then-out" easing curve using a power function.
 * https://www.desmos.com/calculator/fzvpkbwej0
 */
export const inThenOutPow = (x: number, p: number) => {
  return 1 - Math.abs(2 * x - 1) ** p
}

/**
 * In-place elastic ease-out curve (in place means that the curve starts at 0 and ends at 0).
 * @param x the current transition value from 0 to 1
 * @param f the frequency of the sine wave
 * @param p the power of the ease-out curve
 */
export const elasticInPlace = (x: number, f = 2, p = 2) => {
  return Math.sin(f * 2 * Math.PI * x) * Math.pow(1 - x, p)
}

export const easing = {
  linear,

  in1: easeIn1,
  in2: easeIn2,
  in3: easeIn3,
  in4: easeIn4,
  in5: easeIn5,
  in6: easeIn6,

  out1: easeOut1,
  out2: easeOut2,
  out3: easeOut3,
  out4: easeOut4,
  out5: easeOut5,
  out6: easeOut6,

  inOut1: easeInOut1,
  inOut2: easeInOut2,
  inOut3: easeInOut3,
  inOut4: easeInOut4,
  inOut5: easeInOut5,
  inOut6: easeInOut6,

  inOut: easeInOut,
  inLinearOut: easeInLinearEaseOut,

  /**
   * "in-then-out" easing curves are curves that start and end at zero.
   */
  inThenOut: {
    cos: inThenOutCos,
    pow: inThenOutPow,
  },
}