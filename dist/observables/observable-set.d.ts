import { Observable, SetValueOptions } from './observable';
/**
 * ObservableSet is a set that can be observed for changes. Among other things,
 * it can be used to track entering and leaving items.
 */
export declare class ObservableSet<T> extends Observable<Iterable<T>> {
    private _entering;
    private _leaving;
    private get _set();
    private get _setOld();
    get entering(): Set<T>;
    get leaving(): Set<T>;
    get size(): number;
    constructor();
    private swap;
    get value(): Set<T>;
    get valueOld(): Set<T>;
    has(value: T): boolean;
    private _shouldKeep?;
    get shouldKeep(): ((value: T) => boolean) | undefined;
    /**
     * Once defined, the set will now only keep values ​​for which this function returns true.
     *
     * To remove immediately all values that do not meet the condition, call `purge()`.
     */
    setShouldKeep(value: (value: T) => boolean): this;
    purge(shouldKeep?: ((value: T) => boolean) | undefined): boolean;
    setValue(incomingValues: Iterable<T>, options?: SetValueOptions | undefined): boolean;
    /**
     * TODO: Implement this in its own instead of relying on setValue.
     * @param values
     */
    add(...values: T[]): boolean;
    /**
     * TODO: Implement this in its own instead of relying on setValue.
     * @param values
     */
    remove(...values: T[]): boolean;
    clear(): boolean;
    /**
     * Returns the intersection between another set and this set.
     */
    intersection(other: Iterable<T>): Set<T>;
    /**
     * Returns the difference between another set and this set.
     */
    otherDifference(other: Iterable<T>): Set<T>;
}
/**
 * Behavior:
 * ```
 * value: [], entering: [], leaving: [], valueOld: []
 * ----------------
 * add(A, B)
 * ----------------
 * value: [A, B], entering: [A, B], leaving: [], valueOld: []
 * ----------------
 * add(B, C)
 * ----------------
 * value: [A, B, C], entering: [C], leaving: [], valueOld: [A, B]
 * ----------------
 * set([])
 * ```
 */
