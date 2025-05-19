/**
 * A class that represents a bit array.
 * It uses an ArrayBuffer to store the bits in a compact form.
 */
export declare class BitArray {
    #private;
    get length(): number;
    constructor(count: number);
    get(index: number): boolean;
    set(index: number, value: boolean): void;
    clear(): void;
}
//# sourceMappingURL=bit-array.d.ts.map