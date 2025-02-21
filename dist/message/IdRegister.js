import { Hash } from '../hash';
function isPrimitive(value) {
    if (value === null || value === undefined) {
        return true;
    }
    switch (typeof value) {
        case 'function':
        case 'object': {
            return false;
        }
        default: {
            return true;
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
    static _idHash = new Hash();
    static _arrayHash = new Hash();
    _count = 1;
    _map = new Map();
    _weakMap = new WeakMap();
    _getId() {
        return IdRegister._idHash.init().update(++this._count).getValue();
    }
    _registerObject(value) {
        const id = this._getId();
        this._weakMap.set(value, id);
        return id;
    }
    _registerPrimitive(value) {
        const id = this._getId();
        this._map.set(value, id);
        return id;
    }
    _requirePrimitiveId(value) {
        return this._map.get(value) ?? this._registerPrimitive(value);
    }
    _requireObjectId(value) {
        return this._weakMap.get(value) ?? this._registerObject(value);
    }
    _requireArrayId(value) {
        const { _arrayHash } = IdRegister;
        _arrayHash.init();
        for (const item of value.flat(16)) {
            _arrayHash.update(this.requireId(item));
        }
        return _arrayHash.getValue();
    }
    requireId(value) {
        return (isPrimitive(value)
            ? this._requirePrimitiveId(value)
            : Array.isArray(value)
                ? this._requireArrayId(value)
                : this._requireObjectId(value));
    }
}
