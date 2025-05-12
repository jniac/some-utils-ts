export declare class OneToMany<K, V> {
    #private;
    enableReverseMapping: boolean;
    constructor(enableReverseMapping?: boolean);
    /**
     * Add a key-value pair.
     * Multiple values can be associated with the same key.
     */
    add(key: K, value: V): void;
    /**
     * Get all values associated with a key.
     */
    get(key: K): Set<V> | undefined;
    /**
     * Get all keys associated with a value.
     */
    getKeys(value: V): Set<K> | undefined;
    /**
     * Remove a key and all its associated values.
     */
    delete(key: K): boolean;
    /**
     * Remove a value from all associated keys.
     */
    deleteValue(value: V): boolean;
    /**
     * Check if a key exists.
     */
    has(key: K): boolean;
    /**
     * Check if a value exists.
     */
    hasValue(value: V): boolean;
    /**
     * Clear all data.
     */
    clear(): void;
    /**
     * Get the count of unique keys.
     */
    keyCount(): number;
    /**
     * Get the count of unique values.
     */
    valueCount(): number;
}
//# sourceMappingURL=one-to-many.d.ts.map