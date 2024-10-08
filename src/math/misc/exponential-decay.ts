
/**
 * Calculates the value after a certain time has passed, using exponential decay.
 * @param currentValue The current value.
 * @param desiredValue The value to decay towards.
 * @param decay The missing part of the value after 1 second. For example, 0.1 means 10% of the value will be missing after 1 second.
 * @param deltaTime The time that has passed since the last update.
 */
export function calculateExponentialDecay(currentValue: number, desiredValue: number, decay: number, deltaTime: number) {
  const k = -Math.log(decay)
  return desiredValue - (desiredValue - currentValue) * Math.exp(-k * deltaTime)
}

/**
 * Represents a value that decays exponentially towards a target value.
 * 
 * Usage:
 * ```
 * const eg = new ExponentialDecay({ 
 *   value: 0, 
 *   target: 10, 
 *   decay: .33, // 33% will be missing after 1 second
 * })
 * function update(deltaTime: number) {
 *   myPositon += eg.update(deltaTime).value
 * }
 * ```
 */
export class ExponentialDecay {
  value = 0
  target = 0
  /**
   * The missing part of the value after 1 second.
   */
  decay = .1

  constructor(props?: Partial<ExponentialDecay>) {
    if (props) {
      this.set(props)
    }
  }

  set(props: Partial<ExponentialDecay>): this {
    Object.assign(this, props)
    return this
  }

  update(deltaTime: number): this {
    this.value = calculateExponentialDecay(this.value, this.target, this.decay, deltaTime)
    return this
  }
}
