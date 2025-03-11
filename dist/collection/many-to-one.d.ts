export declare class ManyToOne<K, V> {
    #private;
    readonly enableReverseMapping: boolean;
    constructor(enableReverseMapping?: boolean);
    /**
     * Add or set a key-value mapping.
     * If the key was already assigned to another value, the old relation is removed.
     */
    set(key: K, value: V): void;
    /**
     * Get the value associated with a key.
     */
    get(key: K): V | undefined;
    /**
     * Get all keys associated with a value.
     */
    getKeys(value: V): Set<K> | undefined;
    /**
     * Delete a specific key and its relation.
     */
    delete(key: K): boolean;
    /**
     * Delete all keys associated with a given value.
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
     * Clear the whole table.
     */
    clear(): void;
    /**
     * Get number of unique keys.
     */
    keyCount(): number;
    /**
     * Get number of unique values.
     */
    valueCount(): number;
}
