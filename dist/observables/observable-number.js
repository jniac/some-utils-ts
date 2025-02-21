import { calculateExponentialDecay } from '../math/misc/exponential-decay.js';
import { Memorization } from './memorization.js';
import { Observable } from './observable.js';
const passModeValues = ['above', 'below', 'through'];
function clamp(x, min, max) {
    return x < min ? min : x > max ? max : x;
}
export class ObservableNumber extends Observable {
    _memorization = null;
    _lowerBound;
    _upperBound;
    _integer;
    get lowerBound() {
        return this._lowerBound;
    }
    set lowerBound(value) {
        this.setBounds(value, this._upperBound);
    }
    get upperBound() {
        return this._upperBound;
    }
    set upperBound(value) {
        this.setBounds(this._lowerBound, value);
    }
    /**
     * @deprecated Use `lowerBound` instead.
     */
    get min() { return this.lowerBound; }
    /**
     * @deprecated Use `lowerBound` instead.
     */
    set min(value) { this.lowerBound = value; }
    /**
     * @deprecated Use `upperBound` instead.
     */
    get max() { return this.upperBound; }
    /**
     * @deprecated Use `upperBound` instead.
     */
    set max(value) { this.upperBound = value; }
    get delta() {
        return this._value - this._valueOld;
    }
    constructor(initialValue, options) {
        let lowerBound = -Infinity, upperBound = Infinity;
        if (Array.isArray(options)) {
            [lowerBound, upperBound] = options;
            options = {};
        }
        else {
            lowerBound = options?.lowerBound ?? lowerBound;
            upperBound = options?.upperBound ?? upperBound;
        }
        super(clamp(initialValue, lowerBound, upperBound), options);
        this._lowerBound = lowerBound;
        this._upperBound = upperBound;
        this._integer = options?.integer ?? false;
    }
    setValue(incomingValue, options) {
        // Before anything, clamp the incoming value:
        incomingValue = clamp(incomingValue, this._lowerBound, this._upperBound);
        incomingValue = this._integer ? Math.round(incomingValue) : incomingValue;
        // Delay special case:
        if (this._handleDelay(incomingValue, options)) {
            return false;
        }
        // No-delay, regular case:
        const hasChanged = super.setValue(incomingValue, options);
        if (this._memorization) {
            // NOTE: `hasChanged` is ignored with memorization (which may record "zero" changes).
            this._memorization.setValue(this._value, true);
        }
        return hasChanged;
    }
    /**
     * Returns true if the value has changed (because of the new bounds).
     */
    setBounds(min, max) {
        const newValue = clamp(this._value, min, max);
        this._lowerBound = min;
        this._upperBound = max;
        if (this._value !== newValue) {
            return this.setValue(newValue);
        }
        return false;
    }
    /**
     * @deprecated Use `setBounds` instead.
     */
    setMinMax(...args) {
        return this.setBounds(...args);
    }
    /**
     * Memorization is a way to keep track of the value and its derivatives over time.
     *
     * Usage:
     * ```
     * const obs = new ObservableNumber(0)
     *
     * obs.initMemorization(10, { derivativeCount: 2 })
     *
     * // constant accelaration
     * for (let i = 1; i <= 5; i++) {
     *     obs.value = i
     * }
     *
     * // increasing acceleration
     * for (let i = 2; i <= 6; i++) {
     *     obs.value += i
     * }
     *
     * // position:
     * console.log('pos', ...obs.getMemorization().values())
     * // pos 25 19 14 10 7 5 4 3 2 1
     *
     * // velocity (1st derivative):
     * console.log('vel', ...obs.getMemorization().derivative!.values())
     * // vel 6 5 4 3 2 1 1 1 1 1
     *
     * // acceleration (2nd derivative):
     * console.log('acc', ...obs.getMemorization().derivative!.derivative!.values())
     * // acc 1 1 1 1 1 0 0 0 0 1
     * ```
     */
    initMemorization(memorizationLength, { derivativeCount = 0 } = {}) {
        if (typeof arguments[1] === 'number') {
            console.warn('ObservableNumber.initMemorization(memorizationLength, derivativeCount) is deprecated. Use ObservableNumber.initMemorization(memorizationLength, { derivativeCount }) instead.');
            derivativeCount = arguments[1];
        }
        this._memorization = new Memorization(memorizationLength, this._value, derivativeCount);
        return this;
    }
    getMemorization() {
        return this._memorization;
    }
    isAbove(threshold) {
        return this._value >= threshold;
    }
    isBelow(threshold) {
        return this._value < threshold;
    }
    passed(mode, threshold) {
        const { value, valueOld } = this;
        const isAbove = value >= threshold && valueOld < threshold;
        const isBelow = value < threshold && valueOld >= threshold;
        switch (mode) {
            case 'through': return isAbove || isBelow;
            case 'above': return isAbove;
            case 'below': return isBelow;
        }
        throw new Error('Impossible! Typescript, where are you?');
    }
    getPassMode(threshold) {
        const { value, valueOld } = this;
        const isAbove = value >= threshold && valueOld < threshold;
        const isBelow = value < threshold && valueOld >= threshold;
        if (isAbove) {
            return 'above';
        }
        if (isBelow) {
            return 'below';
        }
        return null;
    }
    stepValue(step) {
        return Math.round(this._value / step) * step;
    }
    onStepChange(...args) {
        function solveArgs(args) {
            if (args.length === 3) {
                return args;
            }
            if (args.length === 2) {
                return [args[0], {}, args[1]];
            }
            throw new Error(`Invalid arguments: (${args.join(', ')})`);
        }
        const [step, options, callback] = solveArgs(args);
        let stepValue = NaN;
        return this.onChange(options, () => {
            let newStepValue = this.stepValue(step);
            if (stepValue !== newStepValue) {
                stepValue = newStepValue;
                callback(stepValue, this);
            }
        });
    }
    onPass(mode, threshold, callback) {
        return this.onChange(() => {
            if (this.passed(mode, threshold)) {
                callback(this.value, this);
            }
        });
    }
    increment(delta = 1) {
        return this.setValue(this._value + delta);
    }
    /**
     * @param target The target value.
     * @param alpha The amount to change towards the target.
     *
     * Changes the inner value towards the target by a certain amount.
     *
     * Among options, `modulo` is a special case that allows to change the value
     * in a circular way:
     * ```
     * const seconds = new ObservableNumber(55)
     * seconds.lerpTo(5, .1, { modulo: 60 })
     * console.log(seconds.value) // 56 (and not 50)
     * ```
     *
     */
    lerpTo(target, alpha, { clamp = true, epsilon = 1e-9, modulo = -1, } = {}) {
        const value = this._value;
        if (modulo >= 0) {
            target = (target % modulo + modulo) % modulo;
            const diff = target - value;
            if (Math.abs(diff) > modulo / 2) {
                target = value + (diff > 0 ? diff - modulo : diff + modulo);
            }
            const newValue = Math.abs(target - value) < epsilon ? target :
                value + (target - value) * (clamp ? alpha < 0 ? 0 : alpha > 1 ? 1 : alpha : alpha);
            return this.setValue(newValue % modulo);
        }
        const newValue = Math.abs(target - value) < epsilon ? target :
            value + (target - value) * (clamp ? alpha < 0 ? 0 : alpha > 1 ? 1 : alpha : alpha);
        return this.setValue(newValue);
    }
    /**
     * Linear interpolation of the inner value between the two given values.
     *
     * Note: This will not change the inner value. For that, use {@link lerpTo}.
     */
    lerp(a, b, options) {
        let alpha = this._value;
        if (options?.clamped === true) {
            alpha = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha;
        }
        return a + (b - a) * alpha;
    }
    /**
     * Inverse linear interpolation of the inner value between the two given values.
     *
     * If no values are given, the min and max of the observable are used.
     */
    inverseLerp(a = this.lowerBound, b = this.upperBound, options) {
        let alpha = (this._value - a) / (b - a);
        if (options?.clamped === true) {
            alpha = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha;
        }
        return alpha;
    }
    exponentialDecay(targetValue, decay, deltaTime) {
        return this.setValue(calculateExponentialDecay(this._value, targetValue, decay, deltaTime));
    }
    /**
     * @deprecated Use {@link exponentialDecay} instead.
     * Grow the value exponentially towards the target.
     *
     * If value = 100, target = 200, grow = 0.3, deltaTime = 1, then the new value will be 130.
     *
     * This is useful for smooth transitions, whatever delta time is.
     *
     * @param target The target value.
     * @param grow
     * The amount to grow towards the target per second (e.g. 0.1 for 10%).
     *
     * Grow can be a number (e.g. 0.1) or a tuple [value, deltaTime] (e.g. [0.1, 1]).
     * If it is a tuple, it means that the value will grow by the given value in the given time.
     *
     * Example:
     * If value = 100, target = 200, grow = [0.3, 1], deltaTime = 1, then the new value will be 130 after 0.1 seconds (and 197.17524751 after 1 second).
     *
     * This is useful to express the grow for shorter periods of time than 1 second (in motion design 1 seconds is a very long time).
     * @param deltaTime The time elapsed since the last call.
     * @returns
     */
    exponentialGrow(target, grow, deltaTime) {
        const computeDecay = (grow) => {
            if (typeof grow === 'number') {
                return 1 - grow;
            }
            const [value, deltaTime] = grow;
            return (1 - value) ** (1 / deltaTime);
        };
        const decay = computeDecay(grow);
        const value = target - (target - this._value) * (decay ** deltaTime);
        return this.setValue(value);
    }
}
