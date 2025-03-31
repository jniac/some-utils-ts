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
/**
 * Usage:
 * ```ts
 * const { even, odd } = [1, 2, 3, 4, 5]
 *   .reduce(groupBy(item => item % 2 === 0 ? 'even' : 'odd'), null!) // accumulator will be automatically created if null is provided (but will not work if the array is empty)
 * ```
 */
export function recordBy(keyFn) {
    return (acc, item) => {
        if (acc !== null && typeof acc !== 'object') {
            throw new Error('Accumulator must be an object');
        }
        const record = (acc === null ? {} : acc);
        const key = keyFn(item);
        if (!record[key])
            record[key] = [];
        record[key].push(item);
        return record;
    };
}
