const defaultProps = {
  /**
   * The target value that the lerp should approach.
   * 
   * Defaults to 0.8 ()
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
 * Usage:
 * ```
 * // Approaching 0.8 exponentially over time
 * const t = computeExponentialLerpFactor(deltaTime, { target: .8, timespan: .5 })
 * value = lerp(value, targetValue, t)
 * // or
 * value += (targetValue - value) * t
 * ```
 * 
 * Notes:
 * - It's all about mental models,  "exponential-decay" already offers a way to compute 
 *   a lerp factor, but `computeExponentialLerpFactor()` may be more intuitive to use.
 * @param deltaTime The current delta time (time that has passed since the last update).
 * @param props The properties for the exponential lerp factor calculation.
 * @returns The computed lerp factor.
 */
export function computeExponentialLerpFactor(deltaTime: number, props: Partial<typeof defaultProps>) {
  const target = props?.target ?? defaultProps.target
  const timespan = props?.timespan ?? defaultProps.timespan
  const lambda = -Math.log(1 - target) / timespan
  return 1 - Math.exp(-lambda * deltaTime)
}
