declare const MAX = 2147483647;
declare const DEFAULT_SEED = 123456;
declare const init: (seed?: number) => number;
declare const next: (state: number) => number;
declare const map: (n: number) => number;
/**
 * Wrapper function to get a random number between 0 and 1.
 * @param seed The seed for the random number generator.
 * @returns A function that returns a random number between 0 and 1.
 * @example
 * const random = getRandom(123)
 * console.log(random()) // 0.123456789
 */
declare const getRandom: (seed?: number) => () => number;
export { DEFAULT_SEED, MAX };
export { init, map, next };
export { getRandom };
