
type ValueType = number | bigint | boolean | string

const isValueType = (value: any): value is ValueType => {
  const type = typeof value
  return type === 'number' || type === 'bigint' || type === 'boolean' || type === 'string'
}

type Bundle<K, V> = {
  valueKeys: Set<K>
  objectKeys: WeakSet<any>
  keyCount: number
  value: V
}

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
class MultiKeyWeakMap<K extends object = object, V = any> {
  private _valueMap = new Map<ValueType, V>()
  private _objectMap = new WeakMap<object, V>()
  private _multiValueMap = new Map<ValueType, Set<Bundle<K, V>>>()
  private _multiObjectMap = new WeakMap<object, Set<Bundle<K, V>>>()

  get(key: K | K[]): V | undefined {
    if (Array.isArray(key)) {
      const { _multiValueMap, _multiObjectMap } = this
      for (let index = 0, length = key.length; index < length; index++) {
        const firstKey = key[index] as any
        const bundles = isValueType(firstKey) ? _multiValueMap.get(firstKey) : _multiObjectMap.get(firstKey)
        if (bundles) {
          for (const bundle of bundles) {
            const { keyCount, valueKeys, objectKeys, value } = bundle
            if (keyCount === length && key.every(item => isValueType(item) ? valueKeys.has(item) : objectKeys.has(item))) {
              return value
            }
          }
        }
      }
      return undefined
    } else {
      return (isValueType(key)
        ? this._valueMap.get(key)
        : this._objectMap.get(key))
    }
  }

  set(key: K | K[], value: V): void {
    if (Array.isArray(key)) {
      if (key.length === 0) {
        throw new Error(`Invalid array length!`)
      }
      const { _multiValueMap, _multiObjectMap } = this
      const length = key.length
      // #1: Try to update an existing entry
      for (let index = 0; index < length; index++) {
        const currentKey = key[index] as any
        const bundles = isValueType(currentKey) ? _multiValueMap.get(currentKey) : _multiObjectMap.get(currentKey)
        if (bundles) {
          for (const bundle of bundles) {
            const { keyCount, valueKeys, objectKeys } = bundle
            if (keyCount === length && key.every(item => isValueType(item) ? valueKeys.has(item) : objectKeys.has(item))) {
              bundle.value = value
              return
            }
          }
        }
      }

      // #2: If no existing entry, create a new one
      const valueKeys = new Set<K>()
      const objectKeys = new WeakSet<K>()
      for (let i = 0; i < length; i++) {
        const item = key[i]
        if (isValueType(item)) {
          valueKeys.add(item)
        } else {
          objectKeys.add(item)
        }
      }
      const bundle: Bundle<K, V> = { valueKeys, objectKeys, keyCount: length, value }
      const firstObjectKey = key.find(item => isValueType(item) === false)
      if (firstObjectKey !== undefined) {
        // "Value" type:
        const bundles = _multiObjectMap.get(firstObjectKey)
        if (bundles) {
          bundles.add(bundle)
        } else {
          const bundles = new Set<Bundle<K, V>>()
          bundles.add(bundle)
          _multiObjectMap.set(firstObjectKey, bundles)
        }
      } else {
        // "Object" type:
        const firstValueKey: ValueType = key.find(item => isValueType(item)) as any
        const bundles = _multiValueMap.get(firstValueKey)
        if (bundles) {
          bundles.add(bundle)
        } else {
          const bundles = new Set<Bundle<K, V>>()
          bundles.add(bundle)
          _multiValueMap.set(firstValueKey, bundles)
        }
      }
    } else {
      if (isValueType(key)) {
        this._valueMap.set(key, value)
      } else {
        this._objectMap.set(key, value)
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

export {
  MultiKeyWeakMap
}
