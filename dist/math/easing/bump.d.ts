/**
 * "bump" curve using a sine function. Hard slope at start and end (pi, -pi).
 * https://www.desmos.com/calculator/pcrb50sloy
 */
export declare const sin: (x: number) => number;
/**
 * "bump" curve using a cosine function. Soft slope at start and end (0, 0).
 * https://www.desmos.com/calculator/pcrb50sloy
 */
export declare const cos: (x: number) => number;
/**
 * "bump" curve using a power function.
 * https://www.desmos.com/calculator/pcrb50sloy
 */
export declare const pow: (x: number, p: number) => number;
/**
 * "bump" curve using the Inigo Quilez power function.
 * https://www.desmos.com/calculator/pcrb50sloy
 *
 * Note: Involves 5 power operations.
 */
export declare const iqPower: (x: number, a: number, b: number) => number;
/**
 * "bump" elastic ease-out curve (the curve is NOT normalized).
 * @param x the current transition value from 0 to 1
 * @param f the frequency of the sine wave
 * @param p the power of the ease-out curve
 * https://www.desmos.com/calculator/vi0tuqjn4r
 */
export declare const unnormalizedElastic: (x: number, f?: number, p?: number) => number;
/**
 * "bump" elastic ease-out curve (the curve is roughly normalized).
 * @param x the current transition value from 0 to 1
 * @param f the frequency of the sine wave
 * @param p the power of the ease-out curve
 * https://www.desmos.com/calculator/vi0tuqjn4r
 */
export declare const elastic: (x: number, f?: number, p?: number) => number;
export declare const bump: {
    sin: (x: number) => number;
    cos: (x: number) => number;
    pow: (x: number, p: number) => number;
    iqPower: (x: number, a: number, b: number) => number;
    unnormalizedElastic: (x: number, f?: number, p?: number) => number;
    elastic: (x: number, f?: number, p?: number) => number;
};
//# sourceMappingURL=bump.d.ts.map