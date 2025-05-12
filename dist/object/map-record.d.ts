/**
 * Map keys and values from a record and returns it.
 *
 * Usage:
 * ```
 * const obj = {
 *   foo: 1,
 *   bar: 2,
 * }
 * const mapped = mapRecord(obj, (key, value) => [`my-${key}`, { value }])
 * console.log(mapped['my-foo']) // { value: 1 }
 * ```
 */
export declare function mapRecord<K1 extends string | number | symbol, K2 extends string | number | symbol, V1, V2>(source: Record<K1, V1>, mapper: (key: K1, value: V1) => [K2, V2]): Record<K2, V2>;
export declare function mapRecord<K1 extends string | number | symbol, K2 extends string | number | symbol, V1, V2>(source: Partial<Record<K1, V1>>, mapper: (key: K1, value: V1) => [K2, V2]): Partial<Record<K2, V2>>;
//# sourceMappingURL=map-record.d.ts.map