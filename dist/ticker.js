import { clamp01, lerp } from './math/basic.js';
import { Memorization } from './observables/memorization.js';
let globalTime = 0;
let globalDeltaTime = 0;
let globalFrame = 0;
export class Tick {
    previousTick;
    frame;
    time;
    deltaTime;
    timeScale;
    unscaledTime;
    unscaledDeltaTime;
    activeTimeScale;
    activeTime;
    activeDuration;
    constructor(previousTick = null, frame = 0, time = 0, deltaTime = 0, timeScale = 1, unscaledTime = 0, unscaledDeltaTime = 0, activeTimeScale = 1, activeTime = 0, activeDuration = Ticker.defaultProps.activeDuration) {
        this.previousTick = previousTick;
        this.frame = frame;
        this.time = time;
        this.deltaTime = deltaTime;
        this.timeScale = timeScale;
        this.unscaledTime = unscaledTime;
        this.unscaledDeltaTime = unscaledDeltaTime;
        this.activeTimeScale = activeTimeScale;
        this.activeTime = activeTime;
        this.activeDuration = activeDuration;
    }
    get previousTime() {
        return this.time - this.deltaTime;
    }
    /**
     * Convenient method to get the cosine of the time.
     */
    cosTime({ frequency = 1, phase = 0 } = {}) {
        return Math.cos((this.time + phase) * 2 * Math.PI * frequency);
    }
    /**
     * Convenient method to get the sine of the time.
     */
    sinTime({ frequency = 1, phase = 0 } = {}) {
        return Math.sin((this.time + phase) * 2 * Math.PI * frequency);
    }
    /**
     * Convenient method to get the cosine of the time, but the value is between 0 and 1.
     *
     * It's useful for animations combined with lerp.
     *
     * NOTE: Starts at `0.0`
     */
    cos01Time(...args) {
        return this.cosTime(...args) * -.5 + .5;
    }
    /**
     * Convenient method to get the sine of the time, but the value is between 0 and 1.
     *
     * It's useful for animations combined with lerp.
     *
     * NOTE: Starts at `0.5`
     */
    sin01Time(...args) {
        return this.sinTime(...args) * .5 + .5;
    }
    /**
     * Convenient method to lerp between two values using the cosine of the time.
     */
    lerpCos01Time(a, b, ...args) {
        return lerp(a, b, this.cos01Time(...args));
    }
    /**
     * Convenient method to lerp between two values using the sine of the time.
     */
    lerpSin01Time(a, b, ...args) {
        return lerp(a, b, this.sin01Time(...args));
    }
    static defaultPropagateOptions = {
        /**
         * Children accessor function.
         */
        childrenAccessor: (scope => scope.children),
    };
    /**
     * Convenient method to propagate the tick to the children of a given root object.
     *
     * Usage:
     * ```
     * myTicker.onTick(tick => {
     *   tick.propagate(myRootObject)
     * })
     * ```
     */
    propagate(root, options) {
        const { childrenAccessor: childrenAccessorArg } = { ...Tick.defaultPropagateOptions, ...options };
        const childrenAccessor = typeof childrenAccessorArg === 'function'
            ? childrenAccessorArg
            : (scope) => scope[childrenAccessorArg];
        const queue = [root];
        while (queue.length > 0) {
            const object = queue.shift();
            if (object && typeof object === 'object') {
                if ('onTick' in object) {
                    object['onTick'](this);
                }
                const children = childrenAccessor(object);
                if (Array.isArray(children)) {
                    queue.push(...children);
                }
            }
        }
        return this;
    }
    toString() {
        return `frame: ${this.frame}, time: ${this.time.toFixed(2)}, deltaTime: ${this.deltaTime.toFixed(4)}`;
    }
}
class ListenerRegister {
    static listenerNextId = 0;
    _sortDirty = true;
    _countDirty = true;
    /**
     * The list of listeners. Note that this array is not called directly, but
     * it's used to store the listeners when they are added. The `_clearDirty`
     * method is used to copy the listeners to the `_lockedListeners` array only
     * when needed.
     */
    _listeners = [];
    /**
     * A copy of the listeners that is used to iterate over the listeners.
     */
    _lockedListeners = [];
    add(order, callback) {
        // NOTE: Optimization: we don't need to sort the listeners if the new listener
        // can be appended at the end of the list.
        // NOTE: If the sortDirty flag is already set, it means that the listeners are
        // already not sorted, so we don't need to check the order.
        // So we have to use the "or assign" operator (||=) here.
        this._sortDirty ||= this._listeners.length > 0
            && order < this._listeners[this._listeners.length - 1].order;
        this._countDirty = true;
        const id = ListenerRegister.listenerNextId++;
        const listener = { id, order, callback };
        this._listeners.push(listener);
        return listener;
    }
    remove(callback) {
        const index = this._listeners.findIndex(listener => listener.callback === callback);
        if (index !== -1) {
            this._listeners.splice(index, 1);
            this._countDirty = true;
            return true;
        }
        else {
            return false;
        }
    }
    removeById(id) {
        const index = this._listeners.findIndex(listener => listener.id === id);
        if (index !== -1) {
            this._listeners.splice(index, 1);
            this._countDirty = true;
            return true;
        }
        else {
            return false;
        }
    }
    _clearDirty() {
        if (this._sortDirty) {
            this._listeners.sort((A, B) => A.order - B.order);
            this._sortDirty = false;
        }
        if (this._countDirty) {
            this._lockedListeners = [...this._listeners];
            this._countDirty = false;
        }
    }
    call(tick) {
        this._clearDirty();
        for (const { callback } of this._lockedListeners) {
            const result = callback(tick);
            if (result === 'stop') {
                this.remove(callback);
            }
        }
    }
    toDebugString() {
        this._clearDirty();
        const map = new Map();
        let longestOrderStr = '';
        for (const listener of this._lockedListeners) {
            const orderStr = listener.order.toString();
            if (orderStr.length > longestOrderStr.length) {
                longestOrderStr = orderStr;
            }
            if (map.has(listener.order) === false) {
                map.set(listener.order, [listener]);
            }
            else {
                map.get(listener.order).push(listener);
            }
        }
        const orders = [...map.keys()].sort((A, B) => A - B);
        const str = orders.map(order => {
            const listeners = map.get(order);
            const orderStr = `${order.toString().padStart(longestOrderStr.length)}:`;
            return `${orderStr} (${listeners.length})`;
        }).join('\n');
        return str;
    }
    logDebugString() {
        console.log(this.toDebugString());
    }
    clear() {
        this._listeners.length = 0;
        this._countDirty = true;
    }
}
let tickerNextId = 0;
export class Ticker {
    /**
     * Returns the current ticker (the first one). If there is no ticker, a new
     * ticker will be created.
     */
    static current() {
        const ticker = tickers.length === 0
            ? new Ticker({ name: 'CurrentTicker' })
            : tickers[tickers.length - 1];
        ticker.requestActivation();
        return ticker;
    }
    static get(name, { createIfNotFound = true } = {}) {
        const ticker = tickers.find(ticker => ticker.name === name);
        if (ticker) {
            return ticker;
        }
        else {
            if (createIfNotFound) {
                const ticker = new Ticker({ name });
                ticker.requestActivation();
                return ticker;
            }
            else {
                return null;
            }
        }
    }
    // Static props
    static defaultStaticProps = {
        /**
         * The name of the ticker. It's used identifiy the ticker, by example when
         * calling `Ticker.get(name)`.
         */
        name: null,
        /**
         * The maximum number of ticks that is kept in memory. If the number of ticks
         * exceeds this value, the oldest ticks will be removed.
         *
         * NOTE: Ticks are stored in a linked list, each tick has a reference to the
         * previous tick.
         */
        tickMaxCount: 60,
        /**
         * The maximum deltaTime that can be used in a single tick. It's useful to
         * prevent the application from making huge jumps in time when the application
         * lags for a moment.
         */
        maxDeltaTime: 1 / 10,
    };
    // Dynamic props
    static defaultProps = {
        /**
         * The order of the ticker. The lower the order, the earlier the ticker will be
         * updated.
         *
         * NOTE: Listeners of the ticker have also their own order, which is used to
         * sort the listeners "inside" the ticker.
         */
        order: 0,
        /**
         * The duration of the active state of the ticker. When the ticker is activated,
         * the ticker updates itself until the active duration is reached. After that,
         * the ticker deactivates itself, listeners are no more called.
         *
         * Set to `Infinity` to keep the ticker always active.
         */
        activeDuration: 10,
        /**
         * The duration of the fade-out of the active state of the ticker. This allows
         * to make a smooth transition when the ticker deactivates itself (the application
         * will smoothly stop updating).
         */
        activeFadeDuration: 1,
    };
    id = tickerNextId++;
    name;
    staticProps;
    props;
    internal = {
        active: true,
        stopped: false,
        caughtErrors: false,
        timeScale: 1,
        activeLastRequest: 0,
        memorization: new Memorization(60, 0),
        updateRegister: new ListenerRegister(),
        deactivationRegister: new ListenerRegister(),
        activationRegister: new ListenerRegister(),
    };
    tick = new Tick();
    // Accessors:
    get frame() { return this.tick.frame; }
    get time() { return this.tick.time; }
    get deltaTime() { return this.tick.deltaTime; }
    get timeScale() { return this.internal.timeScale; }
    set timeScale(value) {
        this.internal.timeScale = value;
    }
    get stopped() { return this.internal.stopped; }
    set stopped(value) {
        if (value) {
            this.stop();
        }
        else {
            this.start();
        }
    }
    /**
     * A convenient way to get the current time in the form of an object always up-to-date (getter).
     *
     * Useful for shader uniforms.
     */
    uTime = Object.defineProperty({}, 'value', {
        enumerable: true,
        get: () => this.tick.time,
    });
    constructor(props = {}) {
        this.staticProps = { ...Ticker.defaultStaticProps };
        this.props = { ...Ticker.defaultProps };
        for (const [key, value] of Object.entries(props)) {
            if (key in this.staticProps) {
                this.staticProps[key] = value;
            }
            else {
                this.props[key] = value;
            }
        }
        this.name = this.staticProps.name ?? `Ticker#${this.id}`;
        tickers.push(this);
    }
    destroyed = false;
    destroy = () => {
        if (this.destroyed === false) {
            this.destroyed = true;
            const index = tickers.indexOf(this);
            if (index === -1) {
                throw new Error('Ticker is already destroyed');
            }
            tickers.splice(index, 1);
        }
    };
    start() {
        this.internal.stopped = false;
        this.requestActivation();
        return this;
    }
    stop() {
        this.internal.stopped = true;
        return this;
    }
    toggle(start = this.internal.stopped) {
        return start ? this.start() : this.stop();
    }
    /**
     * `requestActivation()` is binded to the ticker and can be used as a pure callback:
     * ```
     * // This is useless:
     * // anyDestroyableCollector(() => ticker.requestActivation())
     *
     * // This is preferred:
     * anyDestroyableCollector(ticker.requestActivation)
     * ```
     */
    requestActivation = () => {
        this.internal.activeLastRequest = globalTime;
        if (this.internal.active === false) {
            this.internal.active = true;
            this.internal.activationRegister.call(this.tick);
        }
        return this;
    };
    static defaultSetOptions = {
        requestActivation: true,
        minActiveDuration: null,
    };
    set(props) {
        const { requestActivation, minActiveDuration, order, ...rest } = { ...Ticker.defaultSetOptions, ...props };
        // Order is a special case
        if (order !== undefined) {
            this.props.order = order;
            flags.orderChanged = true;
        }
        if (minActiveDuration !== null) {
            this.props.activeDuration = Math.max(this.props.activeDuration, minActiveDuration);
        }
        Object.assign(this.props, rest);
        if (requestActivation) {
            this.requestActivation();
        }
        return this;
    }
    onTick(...args) {
        function solveArgs(args) {
            if (args.length === 1) {
                return [{}, args[0]];
            }
            if (typeof args[0] === 'number') {
                return [{ order: args[0] }, args[1]];
            }
            return args;
        }
        const [options, callback] = solveArgs(args);
        const { order = 0, frameInterval = 0, timeInterval = 0, once = false, } = options;
        if (once) {
            const listener = this.onTick({ ...options, once: false }, tick => {
                listener.destroy();
                callback(tick);
            });
            return listener;
        }
        if (frameInterval > 0) {
            return this.onTick({ order }, tick => {
                if (tick.frame % frameInterval === 0) {
                    return callback(tick);
                }
            });
        }
        if (timeInterval > 0) {
            let cumulativeTime = timeInterval;
            return this.onTick({ order }, tick => {
                cumulativeTime += tick.deltaTime;
                if (cumulativeTime >= timeInterval) {
                    cumulativeTime += -timeInterval;
                    return callback(tick);
                }
            });
        }
        this.internal.updateRegister.add(order, callback);
        const destroy = () => {
            this.internal.updateRegister.remove(callback);
        };
        return { destroy, value: this };
    }
    offTick(callback) {
        return this.internal.updateRegister.remove(callback);
    }
    onActivate(callback) {
        this.requestActivation();
        this.internal.activationRegister.add(0, callback);
        const destroy = () => {
            this.internal.activationRegister.remove(callback);
        };
        return { destroy, value: this };
    }
    onDeactivate(callback) {
        this.internal.deactivationRegister.add(0, callback);
        const destroy = () => {
            this.internal.deactivationRegister.remove(callback);
        };
        return { destroy, value: this };
    }
    /**
     * Mock of window.requestAnimationFrame, with an order option.
     *
     * It's intended to be used in the same way as window.requestAnimationFrame,
     * and helps to use the Ticker instead of window.requestAnimationFrame.
     *
     * Since an order option is available, it's possible to insert the callback
     * to a specific position among the other callbacks.
     */
    requestAnimationFrame = (callback, { order = 0 } = {}) => {
        this.requestActivation(); // Request activation to ensure the callback is called.
        const { updateRegister: updateListeners } = this.internal;
        const listener = updateListeners.add(order, tick => {
            updateListeners.removeById(listener.id);
            callback(tick.time * 1e3);
        });
        return listener.id;
    };
    /**
     * Mock of window.cancelAnimationFrame that works with the Ticker.
     *
     * See {@link Ticker.requestAnimationFrame}
     */
    cancelAnimationFrame(id) {
        const { updateRegister: updateListeners } = this.internal;
        return updateListeners.removeById(id);
    }
    /**
     * Creates the next tick which is immediately dispatched to the listeners.
     *
     * That's the core method of the Ticker. It is automatically called internally.
     * Normally, you don't need to call it manually. But in some cases, it can be
     * used to manually update the ticker, for example to capture every frame of an
     * animation. In such cases, the ticker must be stopped first, after which the
     * `nextTick` method can be called manually:
     *
     * ```
     * ticker.stop()
     * ticker.nextTick(1 / 120)
     * ```
     *
     * @param deltaTime The time that has passed since the last tick.
     * @param activeTime The current "active" time. It's the time that has passed since the ticker was activated OR the last request of activation. It's used internally to calculate the activeTimeScale. For manual use, `0` can be passed.
     * @returns
     */
    nextTick(deltaTime = 1 / 60, activeTime = 0, unscaledDeltaTime = deltaTime) {
        const { timeScale } = this.internal;
        const { tickMaxCount } = this.staticProps;
        const { activeDuration, activeFadeDuration } = this.props;
        const { tick: previousTick } = this;
        const activeExtraTime = clamp01((activeTime - activeDuration) / activeFadeDuration);
        const activeTimeScale = 1 - activeExtraTime * activeExtraTime; // ease-out-2
        const frame = previousTick.frame + 1;
        const time = previousTick.time + deltaTime;
        const unscaledTime = previousTick.unscaledTime + unscaledDeltaTime;
        this.internal.memorization.setValue(deltaTime, true);
        this.tick = new Tick(previousTick, frame, time, deltaTime, timeScale, unscaledTime, unscaledDeltaTime, activeTimeScale, activeTime, activeDuration);
        let currentTick = previousTick;
        let count = 0;
        while (currentTick && ++count < tickMaxCount) {
            currentTick = currentTick.previousTick;
        }
        if (currentTick) {
            currentTick.previousTick = null; // Prevent memory leak
        }
        try {
            this.internal.updateRegister.call(this.tick);
        }
        catch (error) {
            console.error(`Error in Ticker "${this.name}"`);
            console.error(this.tick.toString());
            console.error(error);
            this.internal.caughtErrors = true;
        }
        if (activeTimeScale === 0) {
            this.internal.active = false;
            this.internal.deactivationRegister.call(this.tick);
        }
        return this;
    }
    /**
     * Returns the average deltaTime of the last ticks (the last 60 ticks by default).
     */
    getAverageDeltaTime() {
        return this.internal.memorization.average;
    }
}
const tickers = [];
const flags = {
    orderChanged: false,
};
function update(ms) {
    globalDeltaTime = (ms / 1000) - globalTime;
    globalTime += globalDeltaTime;
    globalFrame++;
    if (flags.orderChanged) {
        tickers.sort((A, B) => A.props.order - B.props.order);
        flags.orderChanged = false;
    }
    for (const ticker of tickers) {
        const { active, activeLastRequest, stopped, timeScale, caughtErrors } = ticker.internal;
        if (caughtErrors || active === false || stopped) {
            return;
        }
        const { maxDeltaTime } = ticker.staticProps;
        const { activeDuration, activeFadeDuration } = ticker.props;
        const activeTime = globalTime - activeLastRequest;
        const activeExtraTime = clamp01((activeTime - activeDuration) / activeFadeDuration);
        const activeTimeScale = 1 - activeExtraTime ** 2; // ease-out-2
        let unscaledDeltaTime = Math.min(globalDeltaTime, maxDeltaTime);
        // Smooth deltaTime
        unscaledDeltaTime = lerp(ticker.tick.unscaledDeltaTime, unscaledDeltaTime, .05);
        const deltaTime = unscaledDeltaTime * timeScale * activeTimeScale;
        ticker.nextTick(deltaTime, activeTime, unscaledDeltaTime);
    }
}
function windowLoop() {
    window.requestAnimationFrame(windowLoop);
    update(performance.now());
}
if (typeof window !== 'undefined') {
    windowLoop();
}
export function onTick(...args) {
    if (typeof args[0] === 'string') {
        const ticker = Ticker.get(args[0], { createIfNotFound: true });
        // @ts-ignore
        return ticker.onTick(...args.slice(1));
    }
    // @ts-ignore
    return Ticker.current().onTick(...args);
}
