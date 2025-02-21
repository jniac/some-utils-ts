/**
 * Loop over a range of numbers (one-dimensional).
 *
 * Important: The yield object is mutable, for performance reasons it is reused
 * on each iteration. If you need to store the values, you should clone the object,
 * or use the {@link loopArray} function.
 *
 * Usage:
 * ```
 * for (const { i, t, p } of loop(10)) {
 *   console.log(i, t, p)
 * }
 * ```
 */
export function* loop(size) {
    let i = 0;
    const out = {
        get i() { return i; },
        get t() { return i / size; },
        get p() { return i / (size - 1); },
        clone() { return { ...this }; }
    };
    for (i = 0; i < size; i++) {
        yield out;
    }
}
/**
 * Loop over a range of numbers (one-dimensional) and store the results in an array.
 *
 * Usage:
 * ```
 * const results = loopArray(10)
 * ```
 */
export function loopArray(size, map) {
    const out = [];
    // @ts-ignore
    for (const item of loop(size)) {
        const it = item.clone();
        out.push(map ? map(it) : it);
    }
    return out;
}
export function* loop2(...args) {
    let sx = 0, sy = 0;
    if (args.length === 2) {
        sx = args[0];
        sy = args[1];
    }
    else {
        if (Array.isArray(args[0])) {
            sx = args[0][0];
            sy = args[0][1];
        }
        else {
            sx = args[0].x;
            sy = args[0].y;
        }
    }
    let i = 0;
    let x = 0;
    let y = 0;
    const out = {
        get i() { return i; },
        get x() { return x; },
        get y() { return y; },
        get tx() { return x / sx; },
        get ty() { return y / sy; },
        get px() { return x / (sx - 1); },
        get py() { return y / (sy - 1); },
        clone() { return { ...this }; }
    };
    for (y = 0; y < sy; y++) {
        for (x = 0; x < sx; x++) {
            yield out;
            i++;
        }
    }
}
export function loop2Array(...args) {
    const out = [];
    // @ts-ignore
    for (const item of loop2(...args)) {
        out.push(item.clone());
    }
    return out;
}
export function* loop3(...args) {
    let sx = 0, sy = 0, sz = 0;
    if (args.length === 3) {
        sx = args[0];
        sy = args[1];
        sz = args[2];
    }
    else {
        if (Array.isArray(args[0])) {
            sx = args[0][0];
            sy = args[0][1];
            sz = args[0][2];
        }
        else {
            sx = args[0].x;
            sy = args[0].y;
            sz = args[0].z;
        }
    }
    let i = 0;
    let x = 0;
    let y = 0;
    let z = 0;
    const out = {
        get i() { return i; },
        get x() { return x; },
        get y() { return y; },
        get z() { return z; },
        get tx() { return x / sx; },
        get ty() { return y / sy; },
        get tz() { return z / sz; },
        get px() { return x / (sx - 1); },
        get py() { return y / (sy - 1); },
        get pz() { return z / (sz - 1); },
        clone() { return { ...this }; }
    };
    for (z = 0; z < sz; z++) {
        for (y = 0; y < sy; y++) {
            for (x = 0; x < sx; x++) {
                yield out;
                i++;
            }
        }
    }
}
export function loop3Array(...args) {
    const out = [];
    // @ts-ignore
    for (const item of loop3(...args)) {
        out.push(item.clone());
    }
    return out;
}
