import { DeepPartial, DeepReadonly } from '../../types';
export type Path = (string | number | symbol)[];
export declare function comparePaths(a: Path, b: Path, { maxLength, useLooseEquality, }?: {
    maxLength?: number | undefined;
    useLooseEquality?: boolean | undefined;
}): boolean;
/**
 * Clones an object deeply.
 *
 * NOTE:
 * - Objects are cloned by invoking their constructor, so they must be instantiable
 *   without arguments.
 */
export declare function deepClone<T>(target: T): T;
/**
 * Performs a deep copy of the `source` object into the `destination` object.
 *
 * Returns `true` if the destination object has changed.
 */
export declare function deepCopy<T extends object>(source: DeepPartial<T>, destination: T, allowNewKeys?: boolean): boolean;
declare const deepWalkOptions: {
    path: Path | undefined;
    ascendants: any[] | undefined;
    dateAsValue: boolean;
    /**
     * If true, the function will treat constructed objects as values.
     *
     * Constructed objects are objects created with a constructor function.
     * For example, if `true`, the function will treat `new MyClass()` as a value.
     *
     * Default: `true`.
     */
    treatConstructedObjectAsValue: boolean;
    onValue: ((value: any, path: Path, ascendants: any[]) => void | "break") | null;
    onObject: ((value: any, path: Path, ascendants: any[]) => void | "break") | null;
};
/**
 * Walks through the target object deeply and invokes the specified callbacks.
 *
 * NOTE: If the `onValue` callback returns `'break'`, the function will stop walking.
 * Use this to break the loop early.
 */
export declare function deepWalk(target: any, options?: Partial<typeof deepWalkOptions>): void;
/**
 * Deeply gets a value from the target object at the specified path.
 */
export declare function deepGet(target: any, path: Path | string): {
    value: any;
    exists: boolean;
};
declare const defaultDeepSetOptions: {
    ascendantsModel: any[] | object | null;
    /**
     * If true, the function will create the ascendants if they don't exist.
     */
    createAscendants: boolean;
    /**
     * If true, the function will pierce through null or undefined values to create the ascendants.
     */
    pierceNullOrUndefined: boolean;
};
type DeepSetOptions = Partial<typeof defaultDeepSetOptions>;
declare enum DeepSetFailureReason {
    None = "none",
    NotAnObject = "not-an-object",
    InvalidIndex = "invalid-index",
    CannotCreateAscendants = "cannot-create-ascendants",
    CannotPierceNullOrUndefined = "cannot-pierce-null-or-undefined"
}
type DeepSetResult = {
    success: boolean;
    failureReason: DeepSetFailureReason;
    hasCreatedAscendants: boolean;
};
/**
 * Deeply sets a value in the target object at the specified path.
 *
 * NOTE: This has been partially tested. Quite trustable. See `deep.test.ts`.
 */
export declare function deepSet(target: any, path: Path | string, value: any, options?: DeepSetOptions): DeepSetResult;
declare const defaultDeepAssignOptions: {
    ignoreUndefined: boolean;
};
/**
 * Similar to `Object.assign`, but performs a deep assignment with some specified options.
 *
 * NOTE: Use this very carefully, it has not been tested thoroughly.
 */
export declare function deepAssignWithOptions<T = any>(options: Partial<typeof defaultDeepAssignOptions>, target: any, ...sources: any[]): T;
/**
 * Similar to `Object.assign`, but performs a deep assignment.
 */
export declare function deepAssign<T = any>(target: any, ...sources: any[]): T;
export declare function deepFreeze<T = any>(obj: T): DeepReadonly<T>;
export {};
//# sourceMappingURL=deep.d.ts.map