/**
 * Multi-Key-Weak-Map collection is not trivial to implement:
 * - Every entry, single or multiple, require two map (a "regular" map and a
 *   "weak" map, since "value-type" values are authorized).
 * - Order is irrelevant, so a simple "get" require a loop over every key.
 * - When the key is multiple, we have to store the according value in set, since
 *   a sub-key may be re-used in different multiple-key.
 * - When the key is multiple, since the first sub-key may be a "value-type", we
 *   have to seek the first "object-type" sub-key, if there is not such key, only
 *   then, we use a "value-type" sub-key as first reference.
 */
/**
 * MultiKeyWeakMap is for associating one or multiple keys to one value.
 *
 * Note:
 * - The key's order does not matter. Keys are handled as a set of keys.
 * - For convenience purpose, MultiKeyWeakMap accepts "primitive" value (string,
 *   numbers etc.). Thoses value are stored in a regular map, associated memory
 *   is never released.
 *
 *
 * Usage:
 * ```
 * // Single key usage:
 * console.log(mymap.get(obj1)) // undefined
 * mymap.set(obj1, 'foo')
 * console.log(mymap.get(obj1)) // "foo"
 *
 * // Multiple keys usage:
 * console.log(mymap.get([obj1, obj2])) // undefined
 * mymap.set([obj1, obj2], 'bar')
 * // A value can be retrieved from an array of keys:
 * console.log(mymap.get([obj1, obj2])) // "bar"
 * // Order has no importance:
 * console.log(mymap.get([obj2, obj1])) // "bar"
 *
 * // An existing value can be updated:
 * mymap.set([obj2, obj1], 'baz')
 * console.log(mymap.get([obj2, obj1])) // "baz"
 * console.log(mymap.get([obj1, obj2])) // "baz"
 *
 * // Subset of keys cannot lead to the value:
 * console.log(mymap.get([obj1])) // undefined
 * console.log(mymap.get([obj2])) // undefined
 * ```
*/
declare class MultiKeyWeakMap<K extends object = object, V = any> {
    private _valueMap;
    private _objectMap;
    private _multiValueMap;
    private _multiObjectMap;
    get(key: K | K[]): V | undefined;
    delete(key: K | K[]): boolean;
    set(key: K | K[], value: V): void;
}
export { MultiKeyWeakMap };
//# sourceMappingURL=multi-key-map.d.ts.map