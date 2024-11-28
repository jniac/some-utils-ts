
/**
 * "bump" curve using a sine function. Hard slope at start and end (pi, -pi).
 * https://www.desmos.com/calculator/pcrb50sloy
 */
export const sin = (x: number) => {
  return Math.sin(Math.PI * x)
}

/**
 * "bump" curve using a cosine function. Soft slope at start and end (0, 0).
 * https://www.desmos.com/calculator/pcrb50sloy
 */
export const cos = (x: number) => {
  return .5 + .5 * Math.cos(2 * Math.PI * (x - .5))
}

/**
 * "bump" curve using a power function.
 * https://www.desmos.com/calculator/pcrb50sloy
 */
export const pow = (x: number, p: number) => {
  return 1 - Math.abs(2 * x - 1) ** p
}

/**
 * "bump" curve using the Inigo Quilez power function. 
 * https://www.desmos.com/calculator/pcrb50sloy
 * 
 * Note: Involves 5 power operations.
 */
export const iqPower = (x: number, a: number, b: number) => {
  return (Math.pow(a + b, a + b) / (Math.pow(a, a) * Math.pow(b, b))) * Math.pow(x, a) * Math.pow(1 - x, b)
}

/**
 * "bump" elastic ease-out curve (the curve is NOT normalized).
 * @param x the current transition value from 0 to 1
 * @param f the frequency of the sine wave
 * @param p the power of the ease-out curve
 * https://www.desmos.com/calculator/vi0tuqjn4r
 */
export const unnormalizedElastic = (x: number, f = 2, p = 2) => {
  return Math.sin(f * 2 * Math.PI * x) * Math.pow(1 - x, p)
}

/**
 * "bump" elastic ease-out curve (the curve is roughly normalized).
 * @param x the current transition value from 0 to 1
 * @param f the frequency of the sine wave
 * @param p the power of the ease-out curve
 * https://www.desmos.com/calculator/vi0tuqjn4r
 */
export const elastic = (x: number, f = 2, p = 2) => {
  const a = 1 / (4 * f)
  const b = 2 / 3 + .4 * (f - 1) / f
  const k = Math.pow(1 - a, -p) * b + 1 - b // normalization factor
  return k * Math.sin(f * 2 * Math.PI * x) * Math.pow(1 - x, p)
}

export const bump = {
  sin,
  cos,
  pow,
  iqPower,
  unnormalizedElastic,
  elastic,
}
