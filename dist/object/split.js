/**
 * Split an object into two sub-objects based on a list of property names.
 *
 * Allow a declarative props split (react):
 * ```
 * const [props1, props2] = splitObject({
 *     foo: 3,
 *     bar: 'baz',
 *     qux: true,
 *   }, ['foo'])
 *
 * props1 // { foo: number }
 * props2 // { bar: string, qux: boolean }
 * ```
 * Useful? Usage will tell.
 */
export function splitObject(source, keys) {
    const entries1 = [];
    const entries2 = [];
    for (const [key, value] of Object.entries(source)) {
        if (keys.includes(key)) {
            entries1.push([key, value]);
        }
        else {
            entries2.push([key, value]);
        }
    }
    return [
        Object.fromEntries(entries1),
        Object.fromEntries(entries2),
    ];
}
