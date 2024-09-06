/**
 * Hashing numbers through simple bitwise operations using ArrayBuffer.
 *
 * Properties:
 * - Hashes numbers as Float64
 * - `getValueAsInt32()` returns , so for one given float there is one chance over
 *   4_294_967_296 to collide with another float.
 *
 * How does it works?
 * - An 16-bytes-length ArrayBuffer is created for each new instance. That small
 *   buffer represents the internal state.
 * - The ArrayBuffer is used to convert 1 Float64 to 2 Int32 without data loss.
 * - Bitwise operations are applied over Int32 values (shift and xor)
 */
export declare class Hash {
    private static _instance;
    static init(): typeof Hash;
    static update(value: number): typeof Hash;
    static updateNumbers(numbers: ArrayLike<number>): typeof Hash;
    static updateString(str: string): typeof Hash;
    static getValue(): number;
    static getValueAsInt32(): number;
    static getDebugString(): string;
    static get value(): number;
    private _buffer;
    private _f64;
    private _i32;
    constructor();
    init(): this;
    update: (value: number) => Hash;
    updateNumbers: (numbers: ArrayLike<number>) => Hash;
    updateString: (str: string) => Hash;
    getValue(): number;
    getValueAsInt32(): number;
    getValueAsBigUint64(): BigInt;
    get value(): number;
    getDebugString(): string;
}
