
export function calculateExponentialGrowth(currentValue: number, desiredValue: number, growthRate: number, deltaTime: number) {
  const k = -Math.log(1 - growthRate)
  const at = desiredValue - (desiredValue - currentValue) * Math.exp(-k * deltaTime)
  return at
}

/**
 * Represents a value that grows exponentially towards a target value.
 * 
 * Usage:
 * ```
 * const eg = new ExponentialGrowth({ 
 *   value: 0, 
 *   target: 10, 
 *   growthRate: .66, // 66% per second
 * })
 * function update(deltaTime: number) {
 *   myPositon += eg.update(deltaTime).value
 * }
 * ```
 */
export class ExponentialGrowth {
  value = 0
  target = 0
  /**
   * The rate at which the value approaches the target (per seconds).
   */
  growthRate = .9

  constructor(props?: Partial<ExponentialGrowth>) {
    if (props) {
      this.set(props)
    }
  }

  set(props: Partial<ExponentialGrowth>): this {
    Object.assign(this, props)
    return this
  }

  update(deltaTime: number): this {
    this.value = calculateExponentialGrowth(this.value, this.target, this.growthRate, deltaTime)
    return this
  }
}

