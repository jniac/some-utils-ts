/**
 * Same as `Array.prototype.some` but for iterables
 */
export function some(values, predicate) {
    for (const value of values) {
        if (predicate(value)) {
            return true;
        }
    }
    return false;
}
/**
 * Same as `Array.prototype.every` but for iterables
 */
export function every(values, predicate) {
    for (const value of values) {
        if (!predicate(value)) {
            return false;
        }
    }
    return true;
}
export function split(array, predicate, count) {
    const result = [];
    function create(index) {
        const array = [];
        result[index] = array;
        return array;
    }
    if (count !== undefined) {
        for (let i = 0; i < count; i++) {
            create(i);
        }
    }
    for (const value of array) {
        const index = predicate(value);
        const subArray = result[index] ?? create(index);
        subArray.push(value);
    }
    return result;
}
