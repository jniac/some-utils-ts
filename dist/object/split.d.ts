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
export declare function splitObject<T extends object, K extends (keyof T)>(source: T, keys: K[]): [
    intersection: {
        [Property in keyof T & K]: T[Property];
    },
    exclusion: {
        [Property in keyof T as Exclude<Property, K>]: T[Property];
    }
];
