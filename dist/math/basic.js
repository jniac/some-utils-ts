export function clamp(x, min, max) {
    return x < min ? min : x > max ? max : x;
}
export function clamp01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
}
export function signedClamp(x, max) {
    return x < -max ? -max : x > max ? max : x;
}
export function lerp(a, b, x) {
    return a + (b - a) * clamp01(x);
}
export function lerpUnclamped(a, b, x) {
    return a + (b - a) * x;
}
export function inverseLerp(a, b, x) {
    return clamp01((x - a) / (b - a));
}
export function inverseLerpUnclamped(a, b, x) {
    return (x - a) / (b - a);
}
export function exponentialLerp(a, b, t) {
    return a * Math.pow(b / a, clamp01(t));
}
export function exponentialLerpUnclamped(a, b, t) {
    return a * Math.pow(b / a, t);
}
export function inverseExponentialLerp(a, b, x) {
    return clamp01(Math.log(x / a) / Math.log(b / a));
}
export function inverseExponentialLerpUnclamped(a, b, x) {
    return Math.log(x / a) / Math.log(b / a);
}
export function remap(x, inMin, inMax, outMin, outMax) {
    return lerpUnclamped(outMin, outMax, inverseLerp(inMin, inMax, x));
}
export function remapUnclamped(x, inMin, inMax, outMin, outMax) {
    return lerpUnclamped(outMin, outMax, inverseLerpUnclamped(inMin, inMax, x));
}
export function round(x, base = 1) {
    return Math.round(x / base) * base;
}
export function roundPowerOfTwo(x) {
    return Math.pow(2, Math.round(Math.log2(x)));
}
export function floor(x, base = 1) {
    return Math.floor(x / base) * base;
}
export function floorPowerOfTwo(x) {
    return Math.pow(2, Math.floor(Math.log2(x)));
}
export function ceil(x, base = 1) {
    return Math.ceil(x / base) * base;
}
export function ceilPowerOfTwo(x) {
    return Math.pow(2, Math.ceil(Math.log2(x)));
}
export function toff(x) {
    return clamp(Math.floor(0x100 * x), 0, 0xff);
}
export function limited(x, limit) {
    return x * limit / (x + limit);
}
export function signedLimited(x, limit) {
    return x < 0 ? -limited(-x, limit) : limited(x, limit);
}
export function cos01(x) {
    return .5 + .5 * Math.cos(x * Math.PI);
}
export function sin01(x) {
    return .5 + .5 * Math.sin(x * Math.PI);
}
export function euclideanDivision(n, d) {
    const i = Math.floor(n / d);
    const r = n - d * i;
    return [i, r];
}
/**
 * Returns the "positive" modulo of "x".
 * ```
 * positiveModulo(-2, 10) // -> 8
 * ```
 */
export function positiveModulo(x, base) {
    x %= base;
    return x < 0 ? x + base : x;
}
/**
 * Return an half-positive-half-negative-modulo, eg:
 * ```
 * middleModulo(190, 360) // -> -170
 * middleModulo(-190, 360) // -> 170
 * middleModulo(370, 360) // -> 10
 * ```
 */
export function middleModulo(x, modulo) {
    x %= modulo;
    return x < -modulo / 2 ? x + modulo : x > modulo / 2 ? x - modulo : x;
}
/**
 * Returns the shortest signed distance between two values.
 * ```
 * moduloDistance(10, 350, 360) // -> -20
 * moduloDistance(350, 10, 360) // -> 20
 * ```
 * NOTE: The order of the arguments matters:
 * ```
 * moduloShortestSignedDistance(a, b, cycle) !== moduloShortestSignedDistance(b, a, cycle)
 * ```
 */
export function moduloShortestSignedDistance(start, end, mod) {
    const d = (end - start) % mod;
    const s = Math.sign(d);
    return s * d > mod / 2
        ? d - s * mod
        : d;
}
/**
 * Clamps a value with progressive limit. Useful for user "drag" feedbacks.
 * https://www.desmos.com/calculator/vssiyqze6q
 */
export function limitedClamp(x, min, minLimit, max, maxLimit) {
    let limit = 0, delta = 0;
    return (x < min ? min + (limit = minLimit - min) * (delta = x - min) / (limit + delta) :
        x > max ? max + (limit = maxLimit - max) * (delta = x - max) / (limit + delta) :
            x);
}
/**
 * Converts a 1D index to a 2D position.
 */
export function index2(index, width) {
    const y = Math.floor(index / width);
    return [index - y * width, y];
}
/**
 * Converts a 1D index to a 3D position.
 */
export function index3(index, width, height) {
    const z = Math.floor(index / (width * height));
    const rest = index - z * width * height;
    const y = Math.floor(rest / width);
    return [rest - y * width, y, z];
}
export function distance2(x, y) {
    return Math.sqrt(x * x + y * y);
}
export function distance3(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
}
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
export function normalize(v) {
    if ('z' in v) {
        const n = distance3(v.x, v.y, v.z);
        v.x /= n;
        v.y /= n;
        v.z /= n;
        return v;
    }
    const n = distance2(v.x, v.y);
    v.x /= n;
    v.y /= n;
    return v;
}
