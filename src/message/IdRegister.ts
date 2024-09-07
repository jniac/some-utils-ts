import { Hash } from '../hash'

type Primitive = boolean | number | bigint | string | symbol

function isPrimitive(value: any): value is Primitive {
  if (value === null || value === undefined) {
    return true
  }
  switch (typeof value) {
    case 'function':
    case 'object': {
      return false
    }
    default: {
      return true
    }
  }
}

/**
 * Returns a unique id (session based) for any given values, which could be:
 * - primitives
 * - (non-array) objects
 * - a combination of the two (array)
 * 
 * ```
 * const idRegister = new IdRegister()
 * const obj = { foo: 'bar' }
 * idRegister.requireId([1, 'A', obj]) === idRegister.requireId([1, 'A', obj]) // true
 * ```
 * 
 * - NOTE: This is not a hash function, it is a unique id generator.
 * - NOTE: Objects are stored weakly, so they will not be retained in memory.
 */
export class IdRegister {
  private static _idHash = new Hash()
  private static _arrayHash = new Hash()
  private _count = 1
  private _map = new Map<Primitive, number>()
  private _weakMap = new WeakMap<object, number>()
  private _getId(): number {
    return IdRegister._idHash.init().update(++this._count).getValue()
  }
  private _registerObject(value: object): number {
    const id = this._getId()
    this._weakMap.set(value, id)
    return id
  }
  private _registerPrimitive(value: Primitive): number {
    const id = this._getId()
    this._map.set(value, id)
    return id
  }
  private _requirePrimitiveId(value: Primitive) {
    return this._map.get(value) ?? this._registerPrimitive(value)
  }
  private _requireObjectId(value: object) {
    return this._weakMap.get(value) ?? this._registerObject(value)
  }
  private _requireArrayId(value: any[]) {
    const { _arrayHash } = IdRegister
    _arrayHash.init()
    for (const item of value.flat(16)) {
      _arrayHash.update(this.requireId(item))
    }
    return _arrayHash.getValue()
  }
  requireId(value: any): number {
    return (isPrimitive(value)
      ? this._requirePrimitiveId(value)
      : Array.isArray(value)
        ? this._requireArrayId(value)
        : this._requireObjectId(value))
  }
}
