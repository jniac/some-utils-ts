/**
 * Calculates the value after a certain time has passed, using exponential decay.
 * @param currentValue The current value.
 * @param desiredValue The value to decay towards.
 * @param decay The missing part of the value after 1 second. For example, 0.1 means 10% of the value will be missing after 1 second.
 * @param deltaTime The time that has passed since the last update.
 */
export function calculateExponentialDecay(currentValue, desiredValue, decay, deltaTime) {
    const k = -Math.log(decay);
    return desiredValue - (desiredValue - currentValue) * Math.exp(-k * deltaTime);
}
/**
 * Calculates the lerp ratio for exponential decay.
 *
 * The returned value can be used to lerp between two values, where the first
 * value is the current value and the second value is the target value.
 *
 * Usage:
 * ```
 * const lerpRatio = calculateExponentialDecayLerpRatio(.33, deltaTime)
 * const value = lerp(currentValue, targetValue, lerpRatio)
 * ```
 *
 * @param decay The missing part of the value after 1 second. For example, 0.1 means 10% of the value will be missing after 1 second.
 * @param deltaTime The time that has passed since the last update.
 */
export function calculateExponentialDecayLerpRatio(decay, deltaTime) {
    const k = -Math.log(decay);
    return 1 - Math.exp(-k * deltaTime);
}
/**
 * Same as `calculateExponentialDecayLerpRatio` but where the decay is specified
 * for a specified `time` value (instead of 1 second).
 *
 * @param decay The missing part of the value after a `time` value.
 * @param time The time that it takes for the value to decay to the target value.
 * @param deltaTime The time that has passed since the last update.
 */
export function calculateExponentialDecayLerpRatio2(decay, time, deltaTime) {
    const decay2 = decay ** (1 / time);
    return calculateExponentialDecayLerpRatio(decay2, deltaTime);
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
    value = 0;
    target = 0;
    /**
     * The missing part of the value after 1 second.
     */
    decay = .1;
    constructor(props) {
        if (props) {
            this.set(props);
        }
    }
    set(props) {
        Object.assign(this, props);
        return this;
    }
    update(deltaTime) {
        this.value = calculateExponentialDecay(this.value, this.target, this.decay, deltaTime);
        return this;
    }
}
//# sourceMappingURL=exponential-decay.js.map