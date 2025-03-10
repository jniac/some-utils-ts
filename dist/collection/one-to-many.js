export class OneToMany {
    #keyToValues = new Map();
    #valueToKeys;
    enableReverseMapping;
    constructor(enableReverseMapping = false) {
        this.enableReverseMapping = enableReverseMapping;
        if (enableReverseMapping) {
            this.#valueToKeys = new Map();
        }
    }
    /**
     * Add a key-value pair.
     * Multiple values can be associated with the same key.
     */
    add(key, value) {
        if (!this.#keyToValues.has(key)) {
            this.#keyToValues.set(key, new Set());
        }
        this.#keyToValues.get(key).add(value);
        if (this.enableReverseMapping) {
            if (!this.#valueToKeys.has(value)) {
                this.#valueToKeys.set(value, new Set());
            }
            this.#valueToKeys.get(value).add(key);
        }
    }
    /**
     * Get all values associated with a key.
     */
    getValues(key) {
        return this.#keyToValues.get(key);
    }
    /**
     * Get all keys associated with a value.
     */
    getKeys(value) {
        if (this.enableReverseMapping) {
            return this.#valueToKeys.get(value);
        }
        else {
            // Exhaustive search if reverse mapping is disabled
            const keys = new Set();
            for (const [k, values] of this.#keyToValues.entries()) {
                if (values.has(value)) {
                    keys.add(k);
                }
            }
            return keys.size > 0 ? keys : undefined;
        }
    }
    /**
     * Remove a key and all its associated values.
     */
    deleteKey(key) {
        if (!this.#keyToValues.has(key)) {
            return false;
        }
        const values = this.#keyToValues.get(key);
        this.#keyToValues.delete(key);
        if (this.enableReverseMapping) {
            for (const value of values) {
                const keys = this.#valueToKeys.get(value);
                if (keys) {
                    keys.delete(key);
                    if (keys.size === 0) {
                        this.#valueToKeys.delete(value);
                    }
                }
            }
        }
        return true;
    }
    /**
     * Remove a value from all associated keys.
     */
    deleteValue(value) {
        if (this.enableReverseMapping) {
            const keys = this.#valueToKeys.get(value);
            if (!keys)
                return false;
            for (const key of keys) {
                const values = this.#keyToValues.get(key);
                if (values) {
                    values.delete(value);
                    if (values.size === 0) {
                        this.#keyToValues.delete(key); // ✅ Remove key if its value set is empty
                    }
                }
            }
            this.#valueToKeys.delete(value);
            return true;
        }
        else {
            // Exhaustive search
            let found = false;
            for (const [key, values] of this.#keyToValues.entries()) {
                if (values.delete(value)) {
                    found = true;
                    if (values.size === 0) {
                        this.#keyToValues.delete(key); // ✅ Remove key if empty
                    }
                }
            }
            return found;
        }
    }
    /**
     * Check if a key exists.
     */
    hasKey(key) {
        return this.#keyToValues.has(key);
    }
    /**
     * Check if a value exists.
     */
    hasValue(value) {
        if (this.enableReverseMapping) {
            return this.#valueToKeys.has(value);
        }
        else {
            for (const values of this.#keyToValues.values()) {
                if (values.has(value))
                    return true;
            }
            return false;
        }
    }
    /**
     * Clear all data.
     */
    clear() {
        this.#keyToValues.clear();
        if (this.enableReverseMapping) {
            this.#valueToKeys.clear();
        }
    }
    /**
     * Get the count of unique keys.
     */
    keyCount() {
        return this.#keyToValues.size;
    }
    /**
     * Get the count of unique values.
     */
    valueCount() {
        if (this.enableReverseMapping) {
            return this.#valueToKeys.size;
        }
        else {
            const uniqueValues = new Set();
            for (const values of this.#keyToValues.values()) {
                for (const value of values) {
                    uniqueValues.add(value);
                }
            }
            return uniqueValues.size;
        }
    }
}
