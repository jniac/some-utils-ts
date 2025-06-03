const saturate = (x: number) => Math.max(0, Math.min(1, x))

export const linear = (x: number) => saturate(x)

const _in = (x: number, p: number) => saturate(x) ** p
export const in1 = linear
export const in2 = (x: number) => (x = saturate(x)) * x
export const in3 = (x: number) => (x = saturate(x)) * x * x
export const in4 = (x: number) => (x = saturate(x)) * x * x * x
export const in5 = (x: number) => (x = saturate(x)) * x * x * x * x
export const in6 = (x: number) => (x = saturate(x)) * x * x * x * x * x

const out = (x: number, p: number) => 1 - saturate(1 - x) ** p
export const out1 = linear
export const out2 = (x: number) => 1 - (x = saturate(1 - x)) * x
export const out3 = (x: number) => 1 - (x = saturate(1 - x)) * x * x
export const out4 = (x: number) => 1 - (x = saturate(1 - x)) * x * x * x
export const out5 = (x: number) => 1 - (x = saturate(1 - x)) * x * x * x * x
export const out6 = (x: number) => 1 - (x = saturate(1 - x)) * x * x * x * x * x

/**
 * Asymmetrical transition function that chains together an transition-in and transition-out curves.
 * https://www.desmos.com/calculator/chosfesws4

 * @param x 
 * @param p The "power" of the transition-in/out curve.
 * @param i The "inflection" point of the transition-in/out curve (0: transition-in, 1: transition-out).
 * @returns 
 */
export const inOut = (x: number, p: number = 3, i: number = 0.5) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < i
    ? 1 / Math.pow(i, p - 1) * Math.pow(x, p)
    : 1 - 1 / Math.pow(1 - i, p - 1) * Math.pow(1 - x, p)
  )
}

export const inOut1 = linear

export const inOut2 = (x: number) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < 0.5
    ? 2 * x * x
    : 1 - 2 * (x = 1 - x) * x
  )
}

export const inOut3 = (x: number) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < 0.5
    ? 4 * x * x * x
    : 1 - 4 * (x = 1 - x) * x * x
  )
}

export const inOut4 = (x: number) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < 0.5
    ? 8 * x * x * x * x
    : 1 - 8 * (x = 1 - x) * x * x * x
  )
}

export const inOut5 = (x: number) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < 0.5
    ? 16 * x * x * x * x * x
    : 1 - 16 * (x = 1 - x) * x * x * x * x
  )
}

export const inOut6 = (x: number) => {
  return (x < 0 ? 0 : x > 1 ? 1 : x < 0.5
    ? 32 * x * x * x * x * x * x
    : 1 - 32 * (x = 1 - x) * x * x * x * x * x
  )
}

/**
 * Powerful transition function that chains together an transition-in and transition-out curves by 
 * a linear interval. The transition-in and transition-out curves use separate coefficient,
 * making very easy to transform a transition from transition in/out to a pure transition-in 
 * or transition-out.
 * 
 * The function is actually NOT optimized (could it be?) and involves from 4 to 5
 * power (to compute internal threshold, and the output when x corresponds to
 * the transition in or out phase).
 * 
 * https://jniac.github.io/some-curves/curves/transition-in-linear-transition-out/
 * https://www.desmos.com/calculator/3izcjwwok7
 * 
 * @param {number} x The current transition value from 0 to 1.
 * @param {number} p The "transition-in" coefficient.
 * @param {number} q The "transition-out" coefficient.
 * @param {number} s The "linear" proportion (0: no linear, 1: full linear)
 */
export const inLinearOut = (x: number, p: number, q: number, s: number) => {
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

export const asymmetricalInOut = (x: number, a: number, b: number) => {
  return Math.pow(x, a) / (Math.pow(x, a) + Math.pow(1 - x, b))
}

export const transition = {
  linear,
  in: _in,
  in1,
  in2,
  in3,
  in4,
  in5,
  in6,
  out,
  out1,
  out2,
  out3,
  out4,
  out5,
  out6,
  inOut,
  inOut1,
  inOut2,
  inOut3,
  inOut4,
  inOut5,
  inOut6,
  inLinearOut,
  asymmetricalInOut,
}
