import { deepGet, deepSet, deepWalk } from './deep.js';
export class DeepDiffResult {
    objectA;
    objectB;
    aOnlyChanges = [];
    bOnlyChanges = [];
    bothChanges = [];
    get totalChangeCount() {
        return this.aOnlyChanges.length + this.bOnlyChanges.length + this.bothChanges.length;
    }
    get aChangeCount() {
        return this.aOnlyChanges.length + this.bothChanges.length;
    }
    get bChangeCount() {
        return this.bOnlyChanges.length + this.bothChanges.length;
    }
    /**
     * Returns an object containing only the changes in `objectA`.
     *
     * Shortcut for `getAChangeObject()`.
     */
    get a() {
        return this.getAChangeObject();
    }
    /**
     * Returns an object containing only the changes in `objectB`.
     *
     * Shortcut for `getBChangeObject()`.
     */
    get b() {
        return this.getBChangeObject();
    }
    constructor(objectA, objectB) {
        this.objectA = objectA;
        this.objectB = objectB;
    }
    *getAChanges() {
        for (const [path, value] of this.aOnlyChanges) {
            yield [path, value];
        }
        for (const [path, aValue, _] of this.bothChanges) {
            yield [path, aValue];
        }
    }
    getAChangeObject() {
        const object = {};
        for (const [path, value] of this.getAChanges()) {
            deepSet(object, path, value, { createAscendants: true });
        }
        return object;
    }
    *getBChanges() {
        for (const [path, value] of this.bOnlyChanges) {
            yield [path, value];
        }
        for (const [path, _, bValue] of this.bothChanges) {
            yield [path, bValue];
        }
    }
    getBChangeObject() {
        const object = {};
        for (const [path, value] of this.getBChanges()) {
            deepSet(object, path, value, { createAscendants: true });
        }
        return object;
    }
}
/**
 * Compares two objects deeply and returns the differences in a diff object.
 *
 * NOTE:
 * - `differences` is the total number of differences.
 * - `aDifferences` is the number of differences in `objectA`.
 * - `bDifferences` is the number of differences in `objectB`.
 * - `differences !== aDifferences + bDifferences` because some differences may be common.
 */
export function deepDiff(objectA, objectB) {
    const diff = new DeepDiffResult(objectA, objectB);
    deepWalk(objectA, {
        treatConstructedObjectAsValue: false, // F***ing important! Since we are comparing the final primitive values.
        onValue(aValue, path) {
            const { value: bValue, exists } = deepGet(objectB, path);
            if (!exists || aValue !== bValue) {
                if (!exists) {
                    diff.aOnlyChanges.push([path, aValue]);
                }
                else {
                    diff.bothChanges.push([path, aValue, bValue]);
                }
            }
        },
    });
    deepWalk(objectB, {
        treatConstructedObjectAsValue: false, // F***ing important! Since we are comparing the final primitive values.
        onValue(bValue, path) {
            const { value: aValue, exists } = deepGet(objectA, path);
            if (!exists || bValue !== aValue) {
                if (!exists) {
                    diff.bOnlyChanges.push([path, bValue]);
                }
                else {
                    // Nothing... (Do not push change paths twice).
                }
            }
        },
    });
    return diff;
}
