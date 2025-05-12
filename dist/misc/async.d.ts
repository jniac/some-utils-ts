export declare function wait(seconds: number): Promise<unknown>;
export declare function waitNextFrame(): Promise<void>;
declare const defaultWaitSecondsOptions: {
    /**
     * The frequency at which the generator will yield.
     */
    frequency: number;
};
/**
 * The name may sound familiar.
 *
 * This generator behaves much like the Unity one.
 *
 * Usage:
 * ```
 * async function someAsyncFunction() {
 *   for await (const tick of waitForSeconds(3)) {
 *     console.log(tick.progress)
 *   }
 * }
 * ```
 */
export declare function waitForSeconds(seconds: number, options?: Partial<typeof defaultWaitSecondsOptions>): AsyncGenerator<{
    readonly tick: number;
    readonly progress: number;
    readonly elapsed: number;
}, void, unknown>;
export {};
//# sourceMappingURL=async.d.ts.map