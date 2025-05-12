export declare enum ScalarType {
    Auto = 0,
    Absolute = 1,
    Relative = 2,
    OppositeRelative = 3,
    SmallerRelative = 4,
    LargerRelative = 5,
    Fraction = 6
}
declare const allScalarExtensions: {
    '%': ScalarType;
    part: ScalarType;
    /**
     * "sh" for "share".
     */
    sh: ScalarType;
    abs: ScalarType;
    rel: ScalarType;
    opp: ScalarType;
    sm: ScalarType;
    lg: ScalarType;
    fr: ScalarType;
};
type ScalarExtension = keyof typeof allScalarExtensions;
export type ScalarDeclaration = 'auto' | number | `${number}` | `${number}${ScalarExtension}`;
export declare function parseScalar(arg: ScalarDeclaration, out?: Scalar): Scalar;
export declare class Scalar {
    static parse(str: ScalarDeclaration, out?: Scalar): Scalar;
    value: number;
    type: ScalarType;
    constructor(value?: number, mode?: ScalarType);
    set(value: number, mode?: ScalarType): void;
    compute(parentValue: number, parentOppositeValue: number): number;
    parse(arg: any): this;
    toString(): string;
}
export {};
//# sourceMappingURL=Scalar.d.ts.map