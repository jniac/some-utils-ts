export declare const linear: (x: number) => number;
export declare const easeIn1: (x: number) => number;
export declare const easeIn2: (x: number) => number;
export declare const easeIn3: (x: number) => number;
export declare const easeIn4: (x: number) => number;
export declare const easeIn5: (x: number) => number;
export declare const easeIn6: (x: number) => number;
export declare const easeOut1: (x: number) => number;
export declare const easeOut2: (x: number) => number;
export declare const easeOut3: (x: number) => number;
export declare const easeOut4: (x: number) => number;
export declare const easeOut5: (x: number) => number;
export declare const easeOut6: (x: number) => number;
/**
 * https://www.desmos.com/calculator/chosfesws4

 * @param x
 * @param p
 * @param i
 * @returns
 */
export declare const easeInOut: (x: number, p?: number, i?: number) => number;
export declare const easeInOut1: (x: number) => number;
export declare const easeInOut2: (x: number) => number;
export declare const easeInOut3: (x: number) => number;
export declare const easeInOut4: (x: number) => number;
export declare const easeInOut5: (x: number) => number;
export declare const easeInOut6: (x: number) => number;
/**
 * Powerful ease function that chains together an ease-in and ease-out curves by
 * a linear interval. The ease-in and ease-out curves use separate coefficient,
 * making very easy to transform a transition from ease in/out to a pure ease-in
 * or ease-out.
 *
 * The function is actually NOT optimized (could it be?) and involves from 4 to 5
 * power (to compute internal threshold, and the output when x corresponds to
 * the ease in or out phase).
 *
 * https://jniac.github.io/some-curves/curves/ease-in-linear-ease-out/
 * https://www.desmos.com/calculator/3izcjwwok7
 *
 * @param {number} x The current transition value from 0 to 1.
 * @param {number} p The "ease-in" coefficient.
 * @param {number} q The "ease-out" coefficient.
 * @param {number} s The "linear" proportion (0: no linear, 1: full linear)
 */
export declare const easeInLinearEaseOut: (x: number, p: number, q: number, s: number) => number;
/**
 * "in-then-out" easing curve using a cosine function.
 * https://www.desmos.com/calculator/koudvu41xb
 */
export declare const inThenOutCos: (x: number) => number;
/**
 * "in-then-out" easing curve using a power function.
 * https://www.desmos.com/calculator/fzvpkbwej0
 */
export declare const inThenOutPow: (x: number, p: number) => number;
export declare const easing: {
    linear: (x: number) => number;
    in1: (x: number) => number;
    in2: (x: number) => number;
    in3: (x: number) => number;
    in4: (x: number) => number;
    in5: (x: number) => number;
    in6: (x: number) => number;
    out1: (x: number) => number;
    out2: (x: number) => number;
    out3: (x: number) => number;
    out4: (x: number) => number;
    out5: (x: number) => number;
    out6: (x: number) => number;
    inOut1: (x: number) => number;
    inOut2: (x: number) => number;
    inOut3: (x: number) => number;
    inOut4: (x: number) => number;
    inOut5: (x: number) => number;
    inOut6: (x: number) => number;
    inOut: (x: number, p?: number, i?: number) => number;
    inLinearOut: (x: number, p: number, q: number, s: number) => number;
    /**
     * "in-then-out" easing curves are curves that start and end at zero.
     */
    inThenOut: {
        cos: (x: number) => number;
        pow: (x: number, p: number) => number;
    };
};
