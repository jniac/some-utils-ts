import { DestroyableObject } from '../types';
import { Memorization } from './memorization';
import { Callback, ConstructorOptions, Observable, OnChangeOptions, SetValueOptions } from './observable';
declare const passModeValues: readonly ["above", "below", "through"];
type PassMode = (typeof passModeValues)[number];
type ConstructorNumberOptions = ConstructorOptions<number> & Partial<{
    upperBound: number;
    lowerBound: number;
    integer: boolean;
}>;
export declare class ObservableNumber extends Observable<number> {
    private _memorization;
    private _lowerBound;
    private _upperBound;
    private _integer;
    get lowerBound(): number;
    set lowerBound(value: number);
    get upperBound(): number;
    set upperBound(value: number);
    /**
     * @deprecated Use `lowerBound` instead.
     */
    get min(): number;
    /**
     * @deprecated Use `lowerBound` instead.
     */
    set min(value: number);
    /**
     * @deprecated Use `upperBound` instead.
     */
    get max(): number;
    /**
     * @deprecated Use `upperBound` instead.
     */
    set max(value: number);
    get delta(): number;
    constructor(initialValue: number, options?: [lowerBound: number, upperBound: number] | ConstructorNumberOptions);
    setValue(incomingValue: number, options?: SetValueOptions): boolean;
    /**
     * Returns true if the value has changed (because of the new bounds).
     */
    setBounds(min: number, max: number): boolean;
    /**
     * @deprecated Use `setBounds` instead.
     */
    setMinMax(...args: Parameters<ObservableNumber['setBounds']>): boolean;
    /**
     * Memorization is a way to keep track of the value and its derivatives over time.
     *
     * Usage:
     * ```
     * const obs = new ObservableNumber(0)
     *
     * obs.initMemorization(10, { derivativeCount: 2 })
     *
     * // constant accelaration
     * for (let i = 1; i <= 5; i++) {
     *     obs.value = i
     * }
     *
     * // increasing acceleration
     * for (let i = 2; i <= 6; i++) {
     *     obs.value += i
     * }
     *
     * // position:
     * console.log('pos', ...obs.getMemorization().values())
     * // pos 25 19 14 10 7 5 4 3 2 1
     *
     * // velocity (1st derivative):
     * console.log('vel', ...obs.getMemorization().derivative!.values())
     * // vel 6 5 4 3 2 1 1 1 1 1
     *
     * // acceleration (2nd derivative):
     * console.log('acc', ...obs.getMemorization().derivative!.derivative!.values())
     * // acc 1 1 1 1 1 0 0 0 0 1
     * ```
     */
    initMemorization(memorizationLength: number, { derivativeCount }?: {
        derivativeCount?: number | undefined;
    }): this;
    getMemorization(): Memorization;
    isAboveOrEqual(threshold: number): boolean;
    /**
     * @deprecated Use `isAboveOrEqual` instead.
     */
    isAbove(threshold: number): boolean;
    isBelow(threshold: number): boolean;
    isAboveOrEqualUpperbound(): boolean;
    isBelowOrEqualLowerbound(): boolean;
    passed(mode: PassMode, threshold: number): boolean;
    getPassMode(threshold: number): (typeof passModeValues)[0] | (typeof passModeValues)[1] | null;
    stepValue(step: number): number;
    /**
     * Same as `onChange` but with a callback that will be called less often since
     * a step is applied to the value.
     */
    onStepChange(step: number, callback: Callback<number>): DestroyableObject;
    onStepChange(step: number, options: OnChangeOptions, callback: Callback<number>): DestroyableObject;
    onPass(mode: PassMode, threshold: number, callback: Callback<number>): DestroyableObject;
    increment(delta?: number): boolean;
    /**
     * @param target The target value.
     * @param alpha The amount to change towards the target.
     *
     * Changes the inner value towards the target by a certain amount.
     *
     * Among options, `modulo` is a special case that allows to change the value
     * in a circular way:
     * ```
     * const seconds = new ObservableNumber(55)
     * seconds.lerpTo(5, .1, { modulo: 60 })
     * console.log(seconds.value) // 56 (and not 50)
     * ```
     *
     */
    lerpTo(target: number, alpha: number, { clamp, epsilon, modulo, }?: {
        clamp?: boolean | undefined;
        epsilon?: number | undefined;
        modulo?: number | undefined;
    }): boolean;
    /**
     * Linear interpolation of the inner value between the two given values.
     *
     * Note: This will not change the inner value. For that, use {@link lerpTo}.
     */
    lerp(a: number, b: number, options?: Partial<{
        clamped: boolean;
    }>): number;
    /**
     * Inverse linear interpolation of the inner value between the two given values.
     *
     * If no values are given, the min and max of the observable are used.
     */
    inverseLerp(a?: number, b?: number, options?: Partial<{
        clamped: boolean;
    }>): number;
    exponentialDecay(targetValue: number, decay: number, deltaTime: number): boolean;
    /**
     * @deprecated Use {@link exponentialDecay} instead.
     * Grow the value exponentially towards the target.
     *
     * If value = 100, target = 200, grow = 0.3, deltaTime = 1, then the new value will be 130.
     *
     * This is useful for smooth transitions, whatever delta time is.
     *
     * @param target The target value.
     * @param grow
     * The amount to grow towards the target per second (e.g. 0.1 for 10%).
     *
     * Grow can be a number (e.g. 0.1) or a tuple [value, deltaTime] (e.g. [0.1, 1]).
     * If it is a tuple, it means that the value will grow by the given value in the given time.
     *
     * Example:
     * If value = 100, target = 200, grow = [0.3, 1], deltaTime = 1, then the new value will be 130 after 0.1 seconds (and 197.17524751 after 1 second).
     *
     * This is useful to express the grow for shorter periods of time than 1 second (in motion design 1 seconds is a very long time).
     * @param deltaTime The time elapsed since the last call.
     * @returns
     */
    exponentialGrow(target: number, grow: number | [value: number, deltaTime: number], deltaTime: number): boolean;
}
export {};
//# sourceMappingURL=observable-number.d.ts.map