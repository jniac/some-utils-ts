declare const simple: {
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
};
type SimpleEasingDeclaration = keyof typeof simple;
type CubicBezierEasingDeclaration = `cubic-bezier(${number}, ${number}, ${number}, ${number})`;
type CustomInOutEasingDeclaration = `inOut(${number})` | `inOut(${number}, ${number})`;
type ElasticInPlaceEasingDeclaration = `elasticInPlace` | `elasticInPlace(${number})` | `elasticInPlace(${number}, ${number})`;
type EaseDeclaration = ((t: number) => number) | SimpleEasingDeclaration | CubicBezierEasingDeclaration | CustomInOutEasingDeclaration | ElasticInPlaceEasingDeclaration;
declare function fromEaseDeclaration(declaration: EaseDeclaration): (value: number) => number;
declare function remap(x: number, inMin: number, inMax: number, outMin: number, outMax: number, easeArg?: ((x: number) => number) | EaseDeclaration): number;
export type { EaseDeclaration };
/**
 * @deprecated Use `fromEaseDeclaration` instead
 */
declare const easing: typeof fromEaseDeclaration;
/**
 * @deprecated Use `fromEaseDeclaration` instead
 */
declare const parseEase: typeof fromEaseDeclaration;
export { easing, fromEaseDeclaration, parseEase, remap };
//# sourceMappingURL=easing.d.ts.map