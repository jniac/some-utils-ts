export const clamp = (x, min, max) => {
    return x < min ? min : x > max ? max : x;
};
export const clamp01 = (x) => {
    return x < 0 ? 0 : x > 1 ? 1 : x;
};
export const signedClamp = (x, max) => {
    return x < -max ? -max : x > max ? max : x;
};
export const lerp = (a, b, x) => {
    return a + (b - a) * clamp01(x);
};
export const lerpUnclamped = (a, b, x) => {
    return a + (b - a) * x;
};
export const inverseLerp = (a, b, x) => {
    return clamp01((x - a) / (b - a));
};
export const inverseLerpUnclamped = (a, b, x) => {
    return (b - x) / (b - a);
};
export const round = (x, base = 1) => {
    return Math.round(x / base) * base;
};
export const roundPowerOfTwo = (x) => {
    return Math.pow(2, Math.round(Math.log2(x)));
};
export const floor = (x, base = 1) => {
    return Math.floor(x / base) * base;
};
export const floorPowerOfTwo = (x) => {
    return Math.pow(2, Math.floor(Math.log2(x)));
};
export const ceil = (x, base = 1) => {
    return Math.ceil(x / base) * base;
};
export const ceilPowerOfTwo = (x) => {
    return Math.pow(2, Math.ceil(Math.log2(x)));
};
export const toff = (x) => {
    return clamp(Math.floor(0x100 * x), 0, 0xff);
};
export const limited = (x, limit) => {
    return x * limit / (x + limit);
};
export const signedLimited = (x, limit) => {
    return x < 0 ? -limited(-x, limit) : limited(x, limit);
};
/**
 * Returns the "positive" modulo of "x".
 * ```
 * positiveModulo(-2, 10) // -> 8
 * ```
 */
export const positiveModulo = (x, base) => {
    x %= base;
    return x < 0 ? x + base : x;
};
/**
 * Return an half-positive-half-negative-modulo, eg:
 * ```
 * middleModulo(190, 360) // -> -170
 * middleModulo(-190, 360) // -> 170
 * middleModulo(370, 360) // -> 10
 * ```
 */
export const middleModulo = (x, modulo) => {
    x %= modulo;
    return x < -modulo / 2 ? x + modulo : x > modulo / 2 ? x - modulo : x;
};
/**
 * Clamps a value with progressive limit. Useful for user "drag" feedbacks.
 * https://www.desmos.com/calculator/vssiyqze6q
 */
export const limitedClamp = (x, min, minLimit, max, maxLimit) => {
    let limit = 0, delta = 0;
    return (x < min ? min + (limit = minLimit - min) * (delta = x - min) / (limit + delta) :
        x > max ? max + (limit = maxLimit - max) * (delta = x - max) / (limit + delta) :
            x);
};
/**
 * Converts a 1D index to a 2D position.
 */
export const index2 = (index, width) => {
    const y = Math.floor(index / width);
    return [index - y * width, y];
};
/**
 * Converts a 1D index to a 3D position.
 */
export const index3 = (index, width, height) => {
    const z = Math.floor(index / (width * height));
    const rest = index - z * width * height;
    const y = Math.floor(rest / width);
    return [rest - y * width, y, z];
};
export const distance2 = (x, y) => {
    return Math.sqrt(x * x + y * y);
};
export const distance3 = (x, y, z) => {
    return Math.sqrt(x * x + y * y + z * z);
};
export function distance(...args) {
    if (args.length === 2) {
        const [a, b] = args;
        return ('z' in a
            ? distance3(a.x - b.x, a.y - b.y, a.z - b.z)
            : distance2(a.x - b.x, a.y - b.y));
    }
    const [x, y, z] = args;
    return (z !== undefined
        ? distance3(x.x, x.y, x.z)
        : distance2(x, y));
}
