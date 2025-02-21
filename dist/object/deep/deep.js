export function comparePaths(a, b, { maxLength = Infinity, useLooseEquality = true, } = {}) {
    const aLen = Math.min(a.length, maxLength);
    const bLen = Math.min(b.length, maxLength);
    if (aLen !== bLen) {
        return false;
    }
    if (useLooseEquality) {
        for (let i = 0; i < aLen; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }
    for (let i = 0; i < aLen; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
function isObject(value) {
    return value !== null && typeof value === 'object';
}
const deepCloneMap = new Map();
deepCloneMap.set(Date, (source) => new Date(source.getTime()));
deepCloneMap.set(RegExp, (source) => new RegExp(source.source, source.flags));
// @ts-ignore
if (typeof window !== 'undefined') {
    // @ts-ignore
    deepCloneMap.set(DOMPoint, (source) => DOMPoint.fromPoint(source));
    // @ts-ignore
    deepCloneMap.set(DOMRect, (source) => DOMRect.fromRect(source));
}
/**
 * Clones an object deeply.
 *
 * NOTE:
 * - Objects are cloned by invoking their constructor, so they must be instantiable
 *   without arguments.
 */
export function deepClone(target) {
    // Primitives
    if (isObject(target) === false) {
        return target;
    }
    // Objects
    // @ts-ignore
    const constructor = target.constructor;
    const cloner = deepCloneMap.get(constructor);
    if (cloner) {
        return cloner(target);
    }
    // Rely on the `clone` method if it exists.
    if ('clone' in target && typeof target.clone === 'function') {
        return target.clone();
    }
    // @ts-ignore
    const clone = new constructor();
    // Rely on the `copy` method if it exists.
    if ('copy' in target && typeof target.copy === 'function') {
        clone.copy(target);
        return clone;
    }
    if (Array.isArray(target)) {
        for (let i = 0, len = target.length; i < len; i++) {
            clone[i] = deepClone(target[i]);
        }
    }
    else {
        // @ts-ignore
        for (const [key, value] of Object.entries(target)) {
            clone[key] = deepClone(value);
        }
    }
    return clone;
}
/**
 * Performs a deep copy of the `source` object into the `destination` object.
 *
 * Returns `true` if the destination object has changed.
 */
export function deepCopy(source, destination, allowNewKeys = false) {
    let hasChanged = false;
    function clone(srcValue, key) {
        // Objects:
        if (isObject(srcValue)) {
            // Dates:
            if (srcValue instanceof Date) {
                const destDate = destination[key];
                if ((destDate instanceof Date) === false || destDate.getTime() !== srcValue.getTime()) {
                    destination[key] = new Date(srcValue.getTime());
                    hasChanged = true;
                }
            }
            // Regular objects:
            else {
                hasChanged = deepCopy(srcValue, destination[key]) || hasChanged;
            }
        }
        // Primitives:
        else {
            if (destination[key] !== srcValue) {
                destination[key] = srcValue;
                hasChanged = true;
            }
        }
    }
    if (Array.isArray(source)) {
        const len = allowNewKeys
            ? source.length
            : Math.min(source.length, destination.length);
        for (let i = 0; i < len; i++) {
            const srcValue = source[i];
            clone(srcValue, i);
        }
    }
    else {
        for (const [key, srcValue] of Object.entries(source)) {
            if (allowNewKeys === false && key in destination === false) {
                continue;
            }
            clone(srcValue, key);
        }
    }
    return hasChanged;
}
const deepWalkOptions = {
    path: undefined,
    ascendants: undefined,
    dateAsValue: true,
    /**
     * If true, the function will treat constructed objects as values.
     *
     * Constructed objects are objects created with a constructor function.
     * For example, if `true`, the function will treat `new MyClass()` as a value.
     *
     * Default: `true`.
     */
    treatConstructedObjectAsValue: true,
    onValue: null,
    onObject: null,
};
/**
 * Walks through the target object deeply and invokes the specified callbacks.
 *
 * NOTE: If the `onValue` callback returns `'break'`, the function will stop walking.
 * Use this to break the loop early.
 */
export function deepWalk(target, options = {}) {
    const { path = [], ascendants = [], dateAsValue: dateAsValue = deepWalkOptions.dateAsValue, treatConstructedObjectAsValue: withConstructorAsValue = deepWalkOptions.treatConstructedObjectAsValue, } = options;
    if (dateAsValue && target instanceof Date) {
        const result = options.onValue?.(target, path, ascendants);
        if (result === 'break') {
            return;
        }
    }
    else if (isObject(target) === false) {
        const result = options.onValue?.(target, path, ascendants);
        if (result === 'break') {
            return;
        }
    }
    else if (withConstructorAsValue && target.constructor !== Object && target.constructor !== Array) {
        const result = options.onValue?.(target, path, ascendants);
        if (result === 'break') {
            return;
        }
    }
    else {
        options.onObject?.(target, path, ascendants);
        for (const key in target) {
            deepWalk(target[key], {
                ...options,
                path: [...path, key],
                ascendants: [...ascendants, target],
            });
        }
    }
}
/**
 * Deeply gets a value from the target object at the specified path.
 */
export function deepGet(target, path) {
    if (typeof path === 'string') {
        path = path.split('.');
    }
    let scope = target;
    for (const key of path) {
        if (isObject(scope) && key in scope) {
            scope = scope[key];
        }
        else {
            return { value: undefined, exists: false };
        }
    }
    return { value: scope, exists: true };
}
const defaultDeepSetOptions = {
    ascendantsModel: null,
    /**
     * If true, the function will create the ascendants if they don't exist.
     */
    createAscendants: true,
    /**
     * If true, the function will pierce through null or undefined values to create the ascendants.
     */
    pierceNullOrUndefined: true,
};
var DeepSetFailureReason;
(function (DeepSetFailureReason) {
    DeepSetFailureReason["None"] = "none";
    DeepSetFailureReason["NotAnObject"] = "not-an-object";
    DeepSetFailureReason["InvalidIndex"] = "invalid-index";
    DeepSetFailureReason["CannotCreateAscendants"] = "cannot-create-ascendants";
    DeepSetFailureReason["CannotPierceNullOrUndefined"] = "cannot-pierce-null-or-undefined";
})(DeepSetFailureReason || (DeepSetFailureReason = {}));
/**
 * Deeply sets a value in the target object at the specified path.
 *
 * NOTE: This has been partially tested. Quite trustable. See `deep.test.ts`.
 */
export function deepSet(target, path, value, options = {}) {
    if (isObject(target) === false) {
        return { success: false, hasCreatedAscendants: false, failureReason: DeepSetFailureReason.NotAnObject };
    }
    if (typeof path === 'string') {
        path = path.split('.');
    }
    const { ascendantsModel, createAscendants, pierceNullOrUndefined, } = { ...defaultDeepSetOptions, ...options };
    let scope = target;
    let parent = scope;
    let hasCreatedAscendants = false;
    const max = path.length - 1;
    for (let index = 0; index < max; index++) {
        parent = scope;
        const key = path[index];
        if (isObject(scope) === false) {
            return { success: false, hasCreatedAscendants, failureReason: DeepSetFailureReason.NotAnObject };
        }
        if (key in scope) {
            scope = scope[key];
        }
        else if (Array.isArray(scope)) {
            const index = typeof key === 'number' ? key : Number.parseInt(key);
            if (isNaN(index) || index < 0) {
                return { success: false, hasCreatedAscendants, failureReason: DeepSetFailureReason.InvalidIndex };
            }
            scope = scope[index];
        }
        // Create the ascendant if it doesn't exist.
        else {
            if (createAscendants === false) {
                return { success: false, hasCreatedAscendants, failureReason: DeepSetFailureReason.CannotCreateAscendants };
            }
            let ascendant = null;
            if (ascendantsModel === null || ascendantsModel === undefined) {
                // Create an array or an object depending on the next key.
                ascendant = typeof path[index + 1] === 'number' ? [] : {};
            }
            // Array:
            else if (Array.isArray(ascendantsModel)) {
                const value = ascendantsModel[index];
                ascendant = deepClone(value);
            }
            // Object:
            else {
                const { value } = deepGet(ascendantsModel, path.slice(0, index));
                ascendant = deepClone(value);
            }
            scope[key] = ascendant;
            scope = ascendant;
            hasCreatedAscendants = true;
        }
        if (scope === undefined || scope === null) {
            if (pierceNullOrUndefined === false) {
                return { success: false, hasCreatedAscendants, failureReason: DeepSetFailureReason.CannotPierceNullOrUndefined };
            }
            // Redefine the current scope.
            scope = typeof path[index + 1] === 'number' ? [] : {};
            parent[key] = scope;
        }
    }
    const lastKey = path[path.length - 1];
    scope[lastKey] = value;
    return { success: true, hasCreatedAscendants, failureReason: DeepSetFailureReason.None };
}
const defaultDeepAssignOptions = {
    ignoreUndefined: false,
};
/**
 * Similar to `Object.assign`, but performs a deep assignment with some specified options.
 *
 * NOTE: Use this very carefully, it has not been tested thoroughly.
 */
export function deepAssignWithOptions(options, target, ...sources) {
    const { ignoreUndefined } = { ...defaultDeepAssignOptions, ...options };
    for (const source of sources) {
        deepWalk(source, {
            onValue(value, path) {
                // Skip undefined values.
                if (ignoreUndefined && value === undefined) {
                    return;
                }
                deepSet(target, path, value, { createAscendants: true });
            },
        });
    }
    return target;
}
/**
 * Similar to `Object.assign`, but performs a deep assignment.
 */
export function deepAssign(target, ...sources) {
    return deepAssignWithOptions({}, target, ...sources);
}
export function deepFreeze(obj) {
    Object.freeze(obj);
    if (isObject(obj)) {
        for (const key in obj) {
            deepFreeze(obj[key]);
        }
    }
    return obj;
}
// import('./deep.test').then(({ test }) => test())
