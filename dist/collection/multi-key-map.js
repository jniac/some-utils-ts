const isValueType = (value) => {
    const type = typeof value;
    return type === 'number' || type === 'bigint' || type === 'boolean' || type === 'string';
};
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
class MultiKeyWeakMap {
    _valueMap = new Map();
    _objectMap = new WeakMap();
    _multiValueMap = new Map();
    _multiObjectMap = new WeakMap();
    get(key) {
        if (Array.isArray(key)) {
            const { _multiValueMap, _multiObjectMap } = this;
            for (let index = 0, length = key.length; index < length; index++) {
                const firstKey = key[index];
                const bundles = isValueType(firstKey) ? _multiValueMap.get(firstKey) : _multiObjectMap.get(firstKey);
                if (bundles) {
                    for (const bundle of bundles) {
                        const { keyCount, valueKeys, objectKeys, value } = bundle;
                        if (keyCount === length && key.every(item => isValueType(item) ? valueKeys.has(item) : objectKeys.has(item))) {
                            return value;
                        }
                    }
                }
            }
            return undefined;
        }
        else {
            return (isValueType(key)
                ? this._valueMap.get(key)
                : this._objectMap.get(key));
        }
    }
    delete(key) {
        if (Array.isArray(key)) {
            const { _multiValueMap, _multiObjectMap } = this;
            for (let index = 0, length = key.length; index < length; index++) {
                const firstKey = key[index];
                const bundles = isValueType(firstKey) ? _multiValueMap.get(firstKey) : _multiObjectMap.get(firstKey);
                if (bundles) {
                    for (const bundle of bundles) {
                        const { keyCount, valueKeys, objectKeys } = bundle;
                        if (keyCount === length && key.every(item => isValueType(item) ? valueKeys.has(item) : objectKeys.has(item))) {
                            bundles.delete(bundle);
                            if (bundles.size === 0) {
                                if (isValueType(firstKey)) {
                                    _multiValueMap.delete(firstKey);
                                }
                                else {
                                    _multiObjectMap.delete(firstKey);
                                }
                            }
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        else {
            if (isValueType(key)) {
                return this._valueMap.delete(key);
            }
            else {
                return this._objectMap.delete(key);
            }
        }
    }
    set(key, value) {
        if (Array.isArray(key)) {
            if (key.length === 0) {
                throw new Error(`Invalid array length!`);
            }
            const { _multiValueMap, _multiObjectMap } = this;
            const length = key.length;
            // #1: Try to update an existing entry
            for (let index = 0; index < length; index++) {
                const currentKey = key[index];
                const bundles = isValueType(currentKey) ? _multiValueMap.get(currentKey) : _multiObjectMap.get(currentKey);
                if (bundles) {
                    for (const bundle of bundles) {
                        const { keyCount, valueKeys, objectKeys } = bundle;
                        if (keyCount === length && key.every(item => isValueType(item) ? valueKeys.has(item) : objectKeys.has(item))) {
                            bundle.value = value;
                            return;
                        }
                    }
                }
            }
            // #2: If no existing entry, create a new one
            const valueKeys = new Set();
            const objectKeys = new WeakSet();
            for (let i = 0; i < length; i++) {
                const item = key[i];
                if (isValueType(item)) {
                    valueKeys.add(item);
                }
                else {
                    objectKeys.add(item);
                }
            }
            const bundle = { valueKeys, objectKeys, keyCount: length, value };
            const firstObjectKey = key.find(item => isValueType(item) === false);
            if (firstObjectKey !== undefined) {
                // "Value" type:
                const bundles = _multiObjectMap.get(firstObjectKey);
                if (bundles) {
                    bundles.add(bundle);
                }
                else {
                    const bundles = new Set();
                    bundles.add(bundle);
                    _multiObjectMap.set(firstObjectKey, bundles);
                }
            }
            else {
                // "Object" type:
                const firstValueKey = key.find(item => isValueType(item));
                const bundles = _multiValueMap.get(firstValueKey);
                if (bundles) {
                    bundles.add(bundle);
                }
                else {
                    const bundles = new Set();
                    bundles.add(bundle);
                    _multiValueMap.set(firstValueKey, bundles);
                }
            }
        }
        else {
            if (isValueType(key)) {
                this._valueMap.set(key, value);
            }
            else {
                this._objectMap.set(key, value);
            }
        }
    }
}
// function testMultiKeyWeakMap() {
//   const m = new MultiKeyWeakMap()
//   m.set([1, 2], 'value-value')
//   console.log(m.get([1, 2]))
//   console.log(m.get([2, 1]))
//   const obj1 = { name: 'foo' }
//   const obj2 = { name: 'bar' }
//   m.set([obj1, obj2], 'object-object')
//   console.log(m.get([obj1, obj2]))
//   console.log(m.get([obj2, obj1]))
//   m.set([obj1, 'plop'], 'object-value')
//   console.log(m.get([obj1, 'plop']))
//   console.log(m.get(['plop', obj1]))
//   m.set([Math.PI, obj1], 'value-object')
//   console.log(m.get([Math.PI, obj1]))
//   console.log(m.get([obj1, Math.PI]))
//   m.set([Math.PI, obj1], 'value-object!!!')
//   console.log(m.get([obj1, Math.PI]))
// }
export { MultiKeyWeakMap };
//# sourceMappingURL=multi-key-map.js.map