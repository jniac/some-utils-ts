import { isObject } from './common.js';
function _deepClone(src) {
    if (Array.isArray(src)) {
        const length = src.length;
        const dst = new Array(length);
        for (let i = 0; i < length; i++) {
            const value = src[i];
            dst[i] = isObject(value) ? _deepClone(value) : value;
        }
        return dst;
    }
    else {
        const dst = {};
        for (const key in src) {
            const value = src[key];
            dst[key] = isObject(value) ? _deepClone(value) : value;
        }
        return dst;
    }
}
function _expandDot(obj) {
    for (const key in obj) {
        let value = obj[key];
        if (isObject(value)) {
            _expandDot(value);
        }
        // Expanding "foo.bar.baz":
        if (key.includes('.')) {
            delete obj[key];
            const tokens = key.split('.');
            for (let i = tokens.length - 1; i >= 1; i--) {
                value = { [tokens[i]]: value };
            }
            obj[tokens[0]] = value;
            continue;
        }
    }
    return obj;
}
function _expandPipe(obj) {
    for (const key in obj) {
        let value = obj[key];
        if (isObject(value)) {
            _expandPipe(value);
        }
        // Expanding "x|y|z"
        if (key.includes('|')) {
            delete obj[key];
            const tokens = key.split('|');
            for (let i = tokens.length - 1; i >= 0; i--) {
                obj[tokens[i]] = isObject(value) ? _deepClone(value) : value;
            }
        }
    }
    return obj;
}
/**
 * Turns an "compressed" object into a regular one.
 *
 * Turns
 * ```
 * { 'foo.bar.x|y|z.value': 2 }
 * ```
 * into
 * ```
 * {
 *   foo: {
 *     bar: {
 *       x: { value: 2 },
 *       y: { value: 2 },
 *       z: { value: 2 },
 *     },
 *   },
 * }
 * ```
 */
export function expandObject(obj) {
    if (isObject(obj) === false) {
        return obj;
    }
    return _expandPipe(_expandDot(_deepClone(obj)));
}
//# sourceMappingURL=expand.js.map