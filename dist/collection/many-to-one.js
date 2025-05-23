export class ManyToOne {
    #keyToValue = new Map();
    #valueToKeys;
    enableReverseMapping;
    constructor(enableReverseMapping = false) {
        this.enableReverseMapping = enableReverseMapping;
        if (enableReverseMapping) {
            this.#valueToKeys = new Map();
        }
    }
    /**
     * Add or set a key-value mapping.
     * If the key was already assigned to another value, the old relation is removed.
     */
    set(key, value) {
        this.delete(key); // Remove any previous mapping for this key
        // Add key -> value
        this.#keyToValue.set(key, value);
        if (this.enableReverseMapping) {
            // Add value -> key (in a set, because many keys can map to the same value)
            if (!this.#valueToKeys.has(value)) {
                this.#valueToKeys.set(value, new Set());
            }
            this.#valueToKeys.get(value).add(key);
        }
    }
    /**
     * Get the value associated with a key.
     */
    get(key) {
        return this.#keyToValue.get(key);
    }
    /**
     * Get all keys associated with a value.
     */
    getKeys(value) {
        if (this.enableReverseMapping) {
            return this.#valueToKeys.get(value);
        }
        else {
            // Exhaustive lookup
            const keys = new Set();
            for (const [k, v] of this.#keyToValue.entries()) {
                if (v === value) {
                    keys.add(k);
                }
            }
            return keys.size > 0 ? keys : undefined;
        }
    }
    /**
     * Delete a specific key and its relation.
     */
    delete(key) {
        if (!this.#keyToValue.has(key)) {
            return false;
        }
        const value = this.#keyToValue.get(key);
        // Remove key -> value mapping
        this.#keyToValue.delete(key);
        if (this.enableReverseMapping) {
            // Remove value -> key mapping
            const keys = this.#valueToKeys.get(value);
            if (keys) {
                keys.delete(key);
                if (keys.size === 0) {
                    this.#valueToKeys.delete(value);
                }
            }
        }
        return true;
    }
    /**
     * Delete all keys associated with a given value.
     */
    deleteValue(value) {
        if (this.enableReverseMapping) {
            const keys = this.#valueToKeys.get(value);
            if (!keys) {
                return false;
            }
            for (const key of keys) {
                this.#keyToValue.delete(key);
            }
            this.#valueToKeys.delete(value);
            return true;
        }
        else {
            // Exhaustive search for deletion
            const keysToDelete = [];
            for (const [k, v] of this.#keyToValue.entries()) {
                if (v === value) {
                    keysToDelete.push(k);
                }
            }
            if (keysToDelete.length === 0)
                return false;
            for (const k of keysToDelete) {
                this.#keyToValue.delete(k);
            }
            return true;
        }
    }
    /**
     * Check if a key exists.
     */
    has(key) {
        return this.#keyToValue.has(key);
    }
    /**
     * Check if a value exists.
     */
    hasValue(value) {
        if (this.enableReverseMapping) {
            return this.#valueToKeys.has(value);
        }
        else {
            for (const v of this.#keyToValue.values()) {
                if (v === value)
                    return true;
            }
            return false;
        }
    }
    /**
     * Clear the whole table.
     */
    clear() {
        this.#keyToValue.clear();
        if (this.enableReverseMapping) {
            this.#valueToKeys.clear();
        }
    }
    /**
     * Get number of unique keys.
     */
    keyCount() {
        return this.#keyToValue.size;
    }
    /**
     * Get number of unique values.
     */
    valueCount() {
        if (this.enableReverseMapping) {
            return this.#valueToKeys.size;
        }
        else {
            return new Set(this.#keyToValue.values()).size;
        }
    }
}
//# sourceMappingURL=many-to-one.js.map