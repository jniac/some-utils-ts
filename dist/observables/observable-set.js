import { Observable } from './observable.js';
/**
 * ObservableSet is a set that can be observed for changes. Among other things,
 * it can be used to track entering and leaving items.
 */
export class ObservableSet extends Observable {
    _entering = new Set();
    _leaving = new Set();
    get _set() { return this._value; }
    get _setOld() { return this._valueOld; }
    get entering() { return new Set(this._entering); }
    get leaving() { return new Set(this._leaving); }
    get size() { return this._set.size; }
    constructor() {
        super(new Set());
        this._valueOld = new Set();
    }
    swap() {
        const { _set, _setOld } = this;
        this._value = _setOld;
        this._valueOld = _set;
    }
    get value() {
        return new Set(this._value);
    }
    get valueOld() {
        return new Set(this._valueOld);
    }
    has(value) {
        return this._value.has(value);
    }
    _shouldKeep;
    get shouldKeep() { return this._shouldKeep; }
    /**
     * Once defined, the set will now only keep values ​​for which this function returns true.
     *
     * To remove immediately all values that do not meet the condition, call `purge()`.
     */
    setShouldKeep(value) {
        this._shouldKeep = value;
        return this;
    }
    purge(shouldKeep = this.shouldKeep) {
        if (!shouldKeep) {
            return false;
        }
        const copy = new Set(this._value);
        let hasChanged = false;
        for (const value of copy) {
            if (!shouldKeep(value)) {
                copy.delete(value);
                hasChanged = true;
            }
        }
        if (hasChanged) {
            return this.setValue(copy);
        }
        return false;
    }
    setValue(incomingValues, options) {
        // Delay special case:
        if (this._handleDelay(incomingValues, options)) {
            return false;
        }
        this.swap();
        const { _set, _setOld, _entering, _leaving, _shouldKeep } = this;
        _entering.clear();
        _leaving.clear();
        _set.clear();
        for (const value of incomingValues) {
            if (_shouldKeep && _shouldKeep(value) === false) {
                continue;
            }
            if (!_setOld.has(value)) {
                _entering.add(value);
            }
            _set.add(value);
        }
        for (const value of _setOld) {
            if (!_set.has(value)) {
                _leaving.add(value);
            }
        }
        const hasChanged = _entering.size > 0 || _leaving.size > 0;
        if (hasChanged) {
            this._invokeListeners();
        }
        return hasChanged;
    }
    /**
     * TODO: Implement this in its own instead of relying on setValue.
     * @param values
     */
    add(...values) {
        return this.setValue([...this.value, ...values]);
    }
    /**
     * TODO: Implement this in its own instead of relying on setValue.
     * @param values
     */
    remove(...values) {
        return this.setValue([...this.value].filter(value => !values.includes(value)));
    }
    clear() {
        return this.setValue([]);
    }
    /**
     * Returns the intersection between another set and this set.
     */
    intersection(other) {
        const result = new Set();
        for (const value of other) {
            if (this.has(value)) {
                result.add(value);
            }
        }
        return result;
    }
    /**
     * Returns the difference between another set and this set.
     */
    otherDifference(other) {
        const result = new Set();
        for (const value of other) {
            if (!this.has(value)) {
                result.add(value);
            }
        }
        return result;
    }
}
/**
 * Behavior:
 * ```
 * value: [], entering: [], leaving: [], valueOld: []
 * ----------------
 * add(A, B)
 * ----------------
 * value: [A, B], entering: [A, B], leaving: [], valueOld: []
 * ----------------
 * add(B, C)
 * ----------------
 * value: [A, B, C], entering: [C], leaving: [], valueOld: [A, B]
 * ----------------
 * set([])
 * ```
 */
// Object.assign(ObservableSet, {
//   test() {
//     const set = new ObservableSet<string>()
//     function log() {
//       console.log(`value: [${[...set.value].join(', ')}], entering(${set.entering.size}): [${[...set.entering].join(', ')}], leaving(${set.leaving.size}): [${[...set.leaving].join(', ')}], valueOld: [${[...set.valueOld].join(', ')}]`)
//     }
//     log()
//     set.set(['A', 'B'])
//     log()
//     set.add('B', 'C')
//     log()
//     set.setValue(['C'])
//     log()
//     set.remove('C')
//     log()
//     set.add(...'ABC')
//     set.add(...'abcdef')
//     set.add('D')
//     log()
//     set
//       .setShouldKeep(value => value === value.toUpperCase())
//       .purge()
//     log()
//     set.add(...'abc')
//     log()
//   }
// })
//# sourceMappingURL=observable-set.js.map