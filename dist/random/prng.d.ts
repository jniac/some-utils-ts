import { Vector2Like, Vector3Like, Vector4Like } from '../types';
declare const defaultPickOptions: {
    /**
     * If true, the weights are assumed to be normalized, otherwise they will be
     * normalized internally before picking.
     */
    weightsAreNormalized: boolean;
    /**
     * If non-zero, the index will be offset by this value and wrapped around the
     * number of options.
     *
     * NOTE:
     * - This is useful to shift the index range to a different starting point
     * essentially in graphics applications where the offset is used to select a
     * preferred sequence of colors or other options.
     * - This will not work if weights are provided.
     */
    indexOffset: number;
    /**
     * If non-empty, the items in this array will be forbidden.
     *
     * If all items are forbidden, the function will throw an error.
     */
    forbiddenItems: any[];
};
type PickOptions<T> = typeof defaultPickOptions & {
    forbiddenItems: T[];
};
type Core = ReturnType<typeof create>;
declare function create(): {
    seed: (seed?: number | string) => Core;
    seedMax: () => number;
    reset: () => Core;
    next: () => Core;
    random: () => number;
    between: {
        (): number;
        (max: number): number;
        (min: number, max: number): number;
        (min: number, max: number, distribution: (x: number) => number): number;
    };
    around: {
        (): number;
        (extent: number): number;
        (extent: number, distribution: (x: number) => number): number;
    };
    int: {
        (maxExclusive: number): number;
        (min: number, maxExclusive: number): number;
        (min: number, maxExclusive: number, distribution: (x: number) => number): number;
    };
    chance: (probability: number) => boolean;
    shuffle: <T>(array: Iterable<T>, { mutate }?: {
        mutate?: boolean | undefined;
    }) => T[];
    pick: {
        <T>(items: T[], weights?: number[] | null, pickOptions?: Partial<PickOptions<T>>): T;
        <T>(items: Record<string, T>, weights?: Record<string, number> | null, pickOptions?: Partial<PickOptions<T>>): T;
    };
    createPicker: <T>(entries: [T, number][]) => () => T;
    vector: {
        <T>(out: T, options?: [min: number, max: number]): T;
        <T>(out: T, options?: {
            min: number;
            max: number;
        }): T;
    };
    unitVector2: <T extends Vector2Like>(out: T) => T;
    unitVector3: <T extends Vector3Like>(out: T) => T;
    normalVector: <T>(out: T) => T;
    unitVector: <T>(out: T) => T;
    boxMuller: (mean?: number, stdDev?: number) => [number, number];
    quaternion: <T extends Vector4Like>(out: T) => T;
    insideCircle: <T extends Vector2Like>(radius: number, out: T) => T;
};
type PRNG = Core & (new (seed?: number) => Core);
/**
 * A pseudo-random number generator based on Park-Miller algorithm.
 *
 * It can be used:
 * - as a static class,
 * - or through instance (for seed encapsulation).
 *
 * ```
 * // Static usage:
 * PRNG.seed(123456789)
 * console.log(PRNG.random()) // 0.114580294689704
 * console.log(PRNG.shuffle([...'abcd'])) // ['b', 'c', 'a', 'd']
 *
 * // Instance usage:
 * const r = new PRNG(123456789)
 * console.log(r.random()) // 0.114580294689704
 * console.log(r.shuffle([...'abcd'])) // ['b', 'c', 'a', 'd']
 * ```
 */
declare const _PRNG: PRNG;
export { _PRNG as PRNG };
