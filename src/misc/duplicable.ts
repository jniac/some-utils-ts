
/**
 * A base class for objects that can be duplicated.
 * 
 * Provides `copy` and `clone` methods.
 * 
 * The provided `copy` method performs a shallow copy of properties from the 
 * source object to the current object.
 * 
 * For fine control over the copying process, override the `copy` method in
 * subclasses.
 */
export class Duplicable {
  /**
   * Copies properties from source to this.
   * 
   * Strong assumption: properties are either primitive values, arrays, or objects with a `copy` method:
   * - Primitive values are copied by value.
   * - Arrays are copied by reference (shallow copy).
   * - Objects with a `copy` method are copied by calling their `copy` method.
   * 
   * If a property is an object without a `copy` method, a warning is logged and the property is not copied.  
   */
  copy(source: this): this {
    for (const key of Object.keys(source)) {
      const value = (this as any)[key]
      if (value && typeof value === 'object') {
        if ('copy' in value) {
          value.copy((source as any)[key])
        } else if (Array.isArray(value)) {
          (this as any)[key] = (source as any)[key].slice()
        } else {
          console.warn(`Cannot copy property "${key}" (${value.constructor.name}) (no copy method on the object value).`)
        }
      } else {
        (this as any)[key] = (source as any)[key]
      }
    }
    return this
  }

  clone(): this {
    return new (this.constructor as new () => this)().copy(this)
  }
}
