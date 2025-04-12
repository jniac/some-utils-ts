export { bump } from './bump';
export { transition } from './transition';
/**
 * Easing functions.
 * Backwards-compatible aliases for `transition`.
 * Prefer using `transition` directly eg:
 * ```
 * import { transition } from 'some-utils-ts/math/easing'
 * const t = transition.inOut3(0.5)
 * ```
 */
export { in1 as easeIn1, in2 as easeIn2, in3 as easeIn3, in4 as easeIn4, in5 as easeIn5, in6 as easeIn6, inOut as easeInOut, inOut1 as easeInOut1, inOut2 as easeInOut2, inOut3 as easeInOut3, inOut4 as easeInOut4, inOut5 as easeInOut5, inOut6 as easeInOut6, out1 as easeOut1, out2 as easeOut2, out3 as easeOut3, out4 as easeOut4, out5 as easeOut5, out6 as easeOut6 } from './transition';
export declare const easing: {
    transition: {
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
    bump: {
        sin: (x: number) => number;
        cos: (x: number) => number;
        pow: (x: number, p: number) => number;
        iqPower: (x: number, a: number, b: number) => number;
        unnormalizedElastic: (x: number, f?: number, p?: number) => number;
        elastic: (x: number, f?: number, p?: number) => number;
    };
};
