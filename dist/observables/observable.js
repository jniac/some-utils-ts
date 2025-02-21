import { clearDelay, withDelay } from './delay';
let observableNextId = 0;
/**
 * Observable is a very simple wrapper around a value (any kind) that makes it
 * to observe changes on that value.
 *
 * It also facilitates
 * - to define "value-mapper" that rewrite internally the value
 * (eg: min / max bounds to number value)
 * - to react to "derived value" (eg: boolean that compare a number value to a
 * threshold)
 *
 * Other benefits may comes from the fact that:
 * - any subscription return a "destroy" function to facilitates... unsubscription.
 * - "setValue()", after having eventually remapped the value, performs an internal
 * check against the current value and do nothing if the value is the same (optim).
 * - it is eventually declined to specific flavour for even more convenience
 * (eg: ObservableNumber)
 *
 * Usage:
 * ```
 * const statusObs = new Observable<'none' | 'pending' | 'ready'>('none')
 * statusObs.onChange(status => {
 *   if (value === 'ready') {
 *     doFancyThings()
 *   }
 * })
 * statusObs.value = 'ready'
 * ```
 */
class Observable {
    static get nextId() { return observableNextId; }
    _observableId = observableNextId++;
    _value;
    _valueOld;
    _valueMapper = null;
    _listeners = new Set();
    _hasChanged = false;
    _delayed = false;
    userData;
    constructor(intialValue, options) {
        this._value = intialValue;
        this._valueOld = intialValue;
        const { valueMapper = null, onChange, userData = {}, } = options ?? {};
        this._valueMapper = valueMapper;
        this.userData = userData;
        if (onChange) {
            this.onChange(onChange);
        }
    }
    /**
     * Handy method to check the inner value in a declarative way:
     * ```
     * if (statusObs.is('ready')) {
     *   doFancyThings()
     * }
     * ```
     */
    is(value) {
        return this._value === value;
    }
    _invokeListeners() {
        const it = this._listeners[Symbol.iterator]();
        while (true) {
            const { value, done } = it.next();
            if (done)
                break;
            value(this._value, this);
        }
    }
    /**
     * Handle the delay internally. Returns true if the observable is delayed, false otherwise.
     */
    _handleDelay(incomingValue, options) {
        if (options?.delay !== undefined) {
            const { delay, ...optionsWithoutDelay } = options;
            withDelay(this, delay, () => {
                this.setValue(incomingValue, optionsWithoutDelay);
            });
            this._delayed = true;
            return true;
        }
        else {
            if (this._delayed) {
                clearDelay(this);
            }
            this._delayed = false;
            return false;
        }
    }
    /**
     * `setValue` makes several things:
     *   - First if a delay is defined, handle the delay.
     * 	 - Then the incoming value is remapped (eg: by applying min, max bounds).
     * 	 - Then the remapped value is compared with the inner one.
     * 	 - If the values are identical, it returns false (meaning: nothing happened)
     * 	 - Otherwise it changes the inner value, call all the listeners and returns true (meaning: something happened).
     * @param incomingValue
     * @returns
     */
    setValue(incomingValue, options) {
        // Delay special case:
        if (this._handleDelay(incomingValue, options)) {
            return false;
        }
        // No more delay, regular case:
        if (this._valueMapper) {
            incomingValue = this._valueMapper(incomingValue, this);
        }
        if (incomingValue === this._value) {
            this._hasChanged = false;
            return false;
        }
        this._valueOld = this._value;
        this._value = incomingValue;
        this._hasChanged = true;
        this._invokeListeners();
        return true;
    }
    valueStringifier = null;
    valueParser = null;
    initializeSerialization(valueStringifier, valueParser) {
        this.valueStringifier = valueStringifier;
        this.valueParser = valueParser;
        return this;
    }
    valueToString() {
        if (this.valueStringifier) {
            return this.valueStringifier(this._value);
        }
        return String(this._value);
    }
    /**
     * Usefull to set the value from a string (eg: from a serialized value).
     */
    setValueFromString(value, options) {
        if (this.valueParser) {
            const parsedValue = this.valueParser(value);
            return this.setValue(parsedValue, options);
        }
        const type = typeof this._value;
        switch (type) {
            case 'string':
                return this.setValue(value, options);
            case 'number':
                return this.setValue(Number(value), options);
            case 'boolean':
                const booleanValue = /^true|1$/.test(value);
                return this.setValue(booleanValue, options);
            case 'bigint':
                return this.setValue(BigInt(value), options);
            default:
                console.warn(`Observable#setValueFromString: Unsupported type "${type}"`);
                return false;
        }
    }
    /**
     * Since the valueMapper can change the inner value, defining a new value mapper
     * with a non-null value internally invokes setValue() and returns the result.
     * @param valueMapper
     * @returns
     */
    setValueMapper(valueMapper) {
        this._valueMapper = valueMapper;
        return valueMapper
            ? this.setValue(valueMapper(this._value, this))
            : false;
    }
    clearListeners() {
        this._listeners.clear();
        return this;
    }
    onChange(...args) {
        const [options, callback] = (args.length === 2 ? args : [{}, args[0]]);
        const { executeImmediately = false, once = false, } = options;
        if (once) {
            // No need to store the callback in the listeners set.
            if (executeImmediately) {
                callback(this._value, this);
                return { destroy: () => { } };
            }
            // Destroyable object that will destroy itself after the first call.
            const destroyable = this.onChange({ ...options, executeImmediately: false, once: false }, (value, obs) => {
                destroyable.destroy();
                callback(value, obs);
            });
            return destroyable;
        }
        this._listeners.add(callback);
        const destroy = () => this._listeners.delete(callback);
        if (executeImmediately) {
            callback(this._value, this);
        }
        return { destroy };
    }
    onDerivativeChange(derivativeExtractor, ...args) {
        let derivative = derivativeExtractor(this._value);
        const [{ executeImmediately = false, }, callback] = (args.length === 2 ? args : [{}, args[0]]);
        if (executeImmediately) {
            callback(derivative, derivative, this._value, this);
        }
        return this.onChange(value => {
            const derivativeOld = derivative;
            derivative = derivativeExtractor(value);
            if (derivative !== derivativeOld) {
                callback(derivative, derivativeOld, value, this);
            }
        });
    }
    onVerify(...args) {
        // Solve args:
        const [options, predicate, callback] = (args.length === 3
            ? args
            : [{}, ...args]);
        // Go on:
        let verify = predicate(this._value);
        if (options.executeImmediately) {
            callback(verify, this._value, this);
        }
        return this.onChange(value => {
            const newVerify = predicate(value);
            if (newVerify !== verify) {
                verify = newVerify;
                callback(verify, value, this);
            }
        });
    }
    // Sugar syntax:
    get observableId() { return this._observableId; }
    get value() { return this._value; }
    set value(value) { this.setValue(value); }
    get valueOld() { return this._valueOld; }
    // Short syntax:
    get = () => this._value;
    set = this.setValue.bind(this);
    log(...args) {
        function solveArgs() {
            if (args.length === 1) {
                if (typeof args[0] === 'function') {
                    return { value: args[0] };
                }
                else {
                    return args[0];
                }
            }
            else {
                return {};
            }
        }
        const { value = (value) => value?.toString() ?? String(value), message = (obs) => `Obs#${this._observableId} value has changed: `, } = solveArgs();
        return this.onChange(() => {
            console.log(`${message(this)} ${value(this._value)}`);
        });
    }
}
export { Observable };
