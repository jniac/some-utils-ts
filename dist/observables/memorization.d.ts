/**
 * Small wrapper around a Float64Array that allows to watch over numeral changes.
 */
export declare class Memorization {
    private _array;
    private _index;
    private _sum;
    derivative: Memorization | null;
    constructor(length: number, initialValue: number, derivativeCount?: number);
    setValue(value: number, asNewValue: boolean): this;
    values(): Generator<number, void, unknown>;
    valuesArray(): number[];
    get sum(): number;
    get average(): number;
}
