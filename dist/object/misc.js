export function withGetters(object, filter = (key) => true) {
    const result = {};
    Object.keys(object).forEach((key) => {
        if (filter(key)) {
            Object.defineProperty(result, key, {
                get: () => object[key],
                enumerable: true,
                configurable: false,
            });
        }
    });
    return result;
}
export function omitUndefined(object) {
    return Object.fromEntries(Object
        .entries(object)
        .filter(([, value]) => value !== undefined));
}
/**
 * @deprecated Use `omitUndefined` instead.
 */
export const withoutUndefined = omitUndefined;
export function omit(object, ...keys) {
    return Object.fromEntries(Object
        .entries(object)
        .filter(([key]) => !keys.includes(key)));
}
export function omitWithGetters(object, ...keys) {
    return withGetters(object, key => !keys.includes(key));
}
export function pick(source, ...keys) {
    return Object.fromEntries(Object
        .entries(source)
        .filter(([key]) => keys.includes(key)));
}
export function pickWithGetters(source, ...keys) {
    return withGetters(source, key => keys.includes(key));
}
