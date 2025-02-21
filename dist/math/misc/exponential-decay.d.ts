/**
 * Calculates the value after a certain time has passed, using exponential decay.
 * @param currentValue The current value.
 * @param desiredValue The value to decay towards.
 * @param decay The missing part of the value after 1 second. For example, 0.1 means 10% of the value will be missing after 1 second.
 * @param deltaTime The time that has passed since the last update.
 */
export declare function calculateExponentialDecay(currentValue: number, desiredValue: number, decay: number, deltaTime: number): number;
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
export declare function calculateExponentialDecayLerpRatio(decay: number, deltaTime: number): number;
/**
 * Same as `calculateExponentialDecayLerpRatio` but where the decay is specified
 * for a specified `time` value (instead of 1 second).
 *
 * @param decay The missing part of the value after a `time` value.
 * @param time The time that it takes for the value to decay to the target value.
 * @param deltaTime The time that has passed since the last update.
 */
export declare function calculateExponentialDecayLerpRatio2(decay: number, time: number, deltaTime: number): number;
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
export declare class ExponentialDecay {
    value: number;
    target: number;
    /**
     * The missing part of the value after 1 second.
     */
    decay: number;
    constructor(props?: Partial<ExponentialDecay>);
    set(props: Partial<ExponentialDecay>): this;
    update(deltaTime: number): this;
}
