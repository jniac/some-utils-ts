export declare const linear: (x: number) => number;
export declare const in1: (x: number) => number;
export declare const in2: (x: number) => number;
export declare const in3: (x: number) => number;
export declare const in4: (x: number) => number;
export declare const in5: (x: number) => number;
export declare const in6: (x: number) => number;
export declare const out1: (x: number) => number;
export declare const out2: (x: number) => number;
export declare const out3: (x: number) => number;
export declare const out4: (x: number) => number;
export declare const out5: (x: number) => number;
export declare const out6: (x: number) => number;
/**
 * Asymmetrical transition function that chains together an transition-in and transition-out curves.
 * https://www.desmos.com/calculator/chosfesws4

 * @param x
 * @param p The "power" of the transition-in/out curve.
 * @param i The "inflection" point of the transition-in/out curve (0: transition-in, 1: transition-out).
 * @returns
 */
export declare const inOut: (x: number, p?: number, i?: number) => number;
export declare const inOut1: (x: number) => number;
export declare const inOut2: (x: number) => number;
export declare const inOut3: (x: number) => number;
export declare const inOut4: (x: number) => number;
export declare const inOut5: (x: number) => number;
export declare const inOut6: (x: number) => number;
/**
 * Powerful transition function that chains together an transition-in and transition-out curves by
 * a linear interval. The transition-in and transition-out curves use separate coefficient,
 * making very easy to transform a transition from transition in/out to a pure transition-in
 * or transition-out.
 *
 * The function is actually NOT optimized (could it be?) and involves from 4 to 5
 * power (to compute internal threshold, and the output when x corresponds to
 * the transition in or out phase).
 *
 * https://jniac.github.io/some-curves/curves/transition-in-linear-transition-out/
 * https://www.desmos.com/calculator/3izcjwwok7
 *
 * @param {number} x The current transition value from 0 to 1.
 * @param {number} p The "transition-in" coefficient.
 * @param {number} q The "transition-out" coefficient.
 * @param {number} s The "linear" proportion (0: no linear, 1: full linear)
 */
export declare const inLinearOut: (x: number, p: number, q: number, s: number) => number;
export declare const asymmetricalInOut: (x: number, a: number, b: number) => number;
export declare const transition: {
    linear: (x: number) => number;
    in: (x: number, p: number) => number;
    in1: (x: number) => number;
    in2: (x: number) => number;
    in3: (x: number) => number;
    in4: (x: number) => number;
    in5: (x: number) => number;
    in6: (x: number) => number;
    out: (x: number, p: number) => number;
    out1: (x: number) => number;
    out2: (x: number) => number;
    out3: (x: number) => number;
    out4: (x: number) => number;
    out5: (x: number) => number;
    out6: (x: number) => number;
    inOut: (x: number, p?: number, i?: number) => number;
    inOut1: (x: number) => number;
    inOut2: (x: number) => number;
    inOut3: (x: number) => number;
    inOut4: (x: number) => number;
    inOut5: (x: number) => number;
    inOut6: (x: number) => number;
    inLinearOut: (x: number, p: number, q: number, s: number) => number;
    asymmetricalInOut: (x: number, a: number, b: number) => number;
};
