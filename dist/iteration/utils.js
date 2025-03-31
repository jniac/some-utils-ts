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
export function distribute(array, predicate, count) {
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
/**
 * Allows you to iterate over pairs of values in an iterable.
 *
 * Usage:
 * ```
 * for (const [a, b] of pairwise([1, 2, 3, 4])) {
 *   console.log(a, b) // 1 2, 2 3, 3 4
 * }
 * ```
 */
export function* pairwise(values) {
    let prev = undefined;
    for (const value of values) {
        if (prev !== undefined) {
            yield [prev, value];
        }
        prev = value;
    }
}
export function findMaxBy(items, score) {
    let bestItem;
    let bestScore = -Infinity;
    for (const item of items) {
        const currentScore = score(item);
        if (currentScore > bestScore) {
            bestScore = currentScore;
            bestItem = item;
        }
    }
    return bestItem;
}
export function uniqueBy(keyFn) {
    const seen = new Set();
    return item => {
        const key = keyFn(item);
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    };
}
export function groupBy(keyFn, items) {
    const record = {};
    for (const item of items) {
        const key = keyFn(item);
        if (!record[key])
            record[key] = [];
        record[key].push(item);
    }
    return record;
}
