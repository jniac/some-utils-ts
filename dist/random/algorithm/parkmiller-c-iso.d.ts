declare const MAX = 2147483647;
declare const DEFAULT_SEED = 123456;
declare const init: (seed?: number) => number;
declare const next: (state: number) => number;
declare const map: (n: number) => number;
export { DEFAULT_SEED, MAX, init, map, next };
