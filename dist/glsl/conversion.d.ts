type Vec3Declaration = string | number | [number, number, number] | {
    x: number;
    y: number;
    z: number;
} | {
    r: number;
    g: number;
    b: number;
};
/**
 * Convenient function to convert a color (or a vector 3) to a vec3 string.
 */
export declare function vec3(arg: Vec3Declaration, { precision, }?: {
    precision?: number | undefined;
}): string;
export {};
