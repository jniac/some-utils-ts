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
export declare class IdRegister {
    private static _idHash;
    private static _arrayHash;
    private _count;
    private _map;
    private _weakMap;
    private _getId;
    private _registerObject;
    private _registerPrimitive;
    private _requirePrimitiveId;
    private _requireObjectId;
    private _requireArrayId;
    requireId(value: any): number;
}
//# sourceMappingURL=IdRegister.d.ts.map