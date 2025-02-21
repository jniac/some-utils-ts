/**
 * Returns a new object with the same keys as the input object, as pure getters.
 *
 * @param object The object to wrap.
 * @param filter A delegate to filter the keys that should be wrapped.
 */
export declare function withGetters<T extends Record<string, any>, K extends keyof T>(object: T): Readonly<T>;
export declare function withGetters<T extends Record<string, any>, K extends keyof T>(object: T, filter: (key: K) => boolean): Partial<T>;
export declare function omitUndefined<T extends Record<string, any>>(object: T): Partial<T>;
/**
 * @deprecated Use `omitUndefined` instead.
 */
export declare const withoutUndefined: typeof omitUndefined;
export declare function omit<T extends Record<string, any>, K extends keyof T>(object: T, ...keys: K[]): Omit<T, K>;
export declare function omitWithGetters<T extends Record<string, any>, K extends keyof T>(object: T, ...keys: K[]): Omit<T, K>;
export declare function pick<T extends object, K extends keyof T>(source: T, ...keys: K[]): Pick<T, K>;
export declare function pickWithGetters<T extends object, K extends keyof T>(source: T, ...keys: K[]): Pick<T, K>;
