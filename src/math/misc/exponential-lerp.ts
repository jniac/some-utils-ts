const defaultProps = {
  /**
   * The target value that the lerp should approach.
   * 
   * Defaults to 0.8 (80% of the way to the target value).
   * 
   * Notes:
   * - 0 means no movement, 1 means instant movement, and values between 0 and 1 will result in a smooth exponential approach to the target value.
   */
  targetFactor: .8,

  /**
   * @deprecated Use `targetFactor` instead.
   */
  target: .8,

  /**
   * The time it takes for the lerp to approach the target value.
   * 
   * Defaults to 1 second.
   */
  timespan: 1,
}

/**
 * Computes a lerp factor that approaches a target value exponentially over time.
 * 
 * ### Usage:
 * ```
 * // Approaching 0.8 exponentially over time
 * const t = computeExponentialLerpFactor(deltaTime, { targetFactor: .8, timespan: .5 })
 * value = lerp(value, targetValue, t)
 * // or
 * value += (targetValue - value) * t
 * ```
 * 
 * ### Example:
 * ```
 * let position = 10
 * const destination = 20
 * const frameRate = 5
 * // One seconds simulation:
 * for (let i = 0; i < frameRate; i++) {
 *   const deltaTime = 1 / frameRate
 *   const t = computeExponentialLerpFactor(deltaTime, { targetFactor: .8 })
 *   position += (destination - position) * t
 *   console.log(`${i}: ${position.toFixed(2)}`)
 * }
 * ```
 * 
 * ```txt
 * Output:
 * 0: 12.75
 * 1: 14.75
 * 2: 16.19
 * 3: 17.24
 * 4: 18.00
 * ```
 * 
 * Notes:
 * - The "real" values of current position and destination are not important, what matters is the relative change over time.
 * - It's all about mental models, "exponential-decay" already offers a way to compute 
 *   a lerp factor, but `computeExponentialLerpFactor()` may be more intuitive to use.
 * @param deltaTime The current delta time (time that has passed since the last update).
 * @param props The properties for the exponential lerp factor calculation.
 * @returns The computed lerp factor.
 */
export function computeExponentialLerpFactor(deltaTime: number, props: Partial<typeof defaultProps>) {
  const targetFactor = props?.targetFactor ?? props?.target ?? defaultProps.targetFactor
  const timespan = props?.timespan ?? defaultProps.timespan
  const lambda = -Math.log(1 - targetFactor) / timespan
  return 1 - Math.exp(-lambda * deltaTime)
}
