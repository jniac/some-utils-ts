import { DestroyableObject } from '../types';
import { Delay } from './delay';
/**
 * ObservableCore is the very basic interface for an observable. It is exposed
 * sperately to allow to any kind of object to be observable (and work with
 * existing observables and hooks).
 */
type ObservableCore<T> = {
    value: T;
    onChange(callback: () => void): DestroyableObject;
};
type ValueMapper<T> = (incomingValue: T, observable: Observable<T>) => T;
type ConstructorOptions<T> = Partial<{
    /** A value mapper to authorize, clamp, rewrite and other fancy effects. */
    valueMapper: ValueMapper<T>;
    /** A first optional listener (that could not be destroyed). */
    onChange: Callback<T>;
    /** A user data object to store any kind of data. */
    userData: Record<string, any>;
}>;
type SetValueOptions = Partial<{
    /**
     * A delay before applying the change.
     *
     * That option is tricky and has huge side effects. Use with caution.
     *
     * NOTE: Very opionated design: Any update in the mean time, delayed OR NOT,
     * that changes OR NOT the inner value, will cancel the delayed change.
     */
    delay: Delay;
}>;
type Callback<T> = (value: T, observable: Observable<T>) => void;
type DerivativeCallback<T, D> = (derivative: D, derivativeOld: D, value: T, observable: Observable<T>) => void;
type VerifyCallback<T> = (verify: boolean, value: T, observable: Observable<T>) => void;
type OnChangeOptions = Partial<{
    executeImmediately: boolean;
    once: boolean;
}>;
/**
 * Observable is a very simple wrapper around a value (any kind) that makes it
 * to observe changes on that value.
 *
 * It also facilitates
 * - to define "value-mapper" that rewrite internally the value
 * (eg: min / max bounds to number value)
 * - to react to "derived value" (eg: boolean that compare a number value to a
 * threshold)
 *
 * Other benefits may comes from the fact that:
 * - any subscription return a "destroy" function to facilitates... unsubscription.
 * - "setValue()", after having eventually remapped the value, performs an internal
 * check against the current value and do nothing if the value is the same (optim).
 * - it is eventually declined to specific flavour for even more convenience
 * (eg: ObservableNumber)
 *
 * Usage:
 * ```
 * const statusObs = new Observable<'none' | 'pending' | 'ready'>('none')
 * statusObs.onChange(status => {
 *   if (value === 'ready') {
 *     doFancyThings()
 *   }
 * })
 * statusObs.value = 'ready'
 * ```
 */
declare class Observable<T = any> implements ObservableCore<T> {
    static get nextId(): number;
    protected readonly _observableId: number;
    protected _value: T;
    protected _valueOld: T;
    protected _valueMapper: ValueMapper<T> | null;
    protected _listeners: Set<Callback<T>>;
    protected _hasChanged: boolean;
    protected _delayed: boolean;
    userData: Record<string, any>;
    constructor(intialValue: T, options?: ConstructorOptions<T>);
    /**
     * Handy method to check the inner value in a declarative way:
     * ```
     * if (statusObs.is('ready')) {
     *   doFancyThings()
     * }
     * ```
     */
    is(value: T): boolean;
    protected _invokeListeners(): void;
    /**
     * Handle the delay internally. Returns true if the observable is delayed, false otherwise.
     */
    protected _handleDelay(incomingValue: T, options?: SetValueOptions): boolean;
    /**
     * `setValue` makes several things:
     *   - First if a delay is defined, handle the delay.
     * 	 - Then the incoming value is remapped (eg: by applying min, max bounds).
     * 	 - Then the remapped value is compared with the inner one.
     * 	 - If the values are identical, it returns false (meaning: nothing happened)
     * 	 - Otherwise it changes the inner value, call all the listeners and returns true (meaning: something happened).
     * @param incomingValue
     * @returns
     */
    setValue(incomingValue: T, options?: SetValueOptions): boolean;
    protected valueStringifier: ((value: T) => string) | null;
    protected valueParser: ((value: string) => T) | null;
    initializeSerialization(valueStringifier: (value: T) => string, valueParser: (value: string) => T): this;
    valueToString(): string;
    /**
     * Usefull to set the value from a string (eg: from a serialized value).
     */
    setValueFromString(value: string, options?: SetValueOptions): boolean;
    /**
     * Since the valueMapper can change the inner value, defining a new value mapper
     * with a non-null value internally invokes setValue() and returns the result.
     * @param valueMapper
     * @returns
     */
    setValueMapper(valueMapper: ValueMapper<T> | null): boolean;
    clearListeners(): this;
    onChange(callback: Callback<T>): DestroyableObject;
    onChange(options: OnChangeOptions, callback: Callback<T>): DestroyableObject;
    onDerivativeChange<D>(derivativeExtractor: (value: T) => D, callback: DerivativeCallback<T, D>): DestroyableObject;
    onDerivativeChange<D>(derivativeExtractor: (value: T) => D, options: OnChangeOptions, callback: DerivativeCallback<T, D>): DestroyableObject;
    onVerify(predicate: (value: T) => boolean, callback: VerifyCallback<T>): DestroyableObject;
    onVerify(options: OnChangeOptions, predicate: (value: T) => boolean, callback: VerifyCallback<T>): DestroyableObject;
    get observableId(): number;
    get value(): T;
    set value(value: T);
    get valueOld(): T;
    get: () => T;
    set: (typeof this)['setValue'];
    log(value?: (value: T) => string): DestroyableObject;
    log(options?: {
        value: (value: T) => string;
        message: (obs: Observable<T>) => string;
    }): DestroyableObject;
}
export type { Callback, ConstructorOptions, DerivativeCallback, ObservableCore, OnChangeOptions, SetValueOptions };
export { Observable };
//# sourceMappingURL=observable.d.ts.map