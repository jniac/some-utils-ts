import { clamp01 } from './math/basic';
let globalTime = 0;
let globalDeltaTime = 0;
let globalFrame = 0;
class Tick {
    previousTick;
    frame;
    time;
    deltaTime;
    timeScale;
    activeTimeScale;
    activeTime;
    activeDuration;
    constructor(previousTick = null, frame = 0, time = 0, deltaTime = 0, timeScale = 1, activeTimeScale = 1, activeTime = 0, activeDuration = Ticker.defaultProps.activeDuration) {
        this.previousTick = previousTick;
        this.frame = frame;
        this.time = time;
        this.deltaTime = deltaTime;
        this.timeScale = timeScale;
        this.activeTimeScale = activeTimeScale;
        this.activeTime = activeTime;
        this.activeDuration = activeDuration;
    }
    get previousTime() {
        return this.time - this.deltaTime;
    }
    toString() {
        return `frame: ${this.frame}, time: ${this.time.toFixed(2)}, deltaTime: ${this.deltaTime.toFixed(4)}`;
    }
}
class Listeners {
    static listenerNextId = 0;
    _sortDirty = true;
    _countDirty = true;
    _listeners = [];
    _loopListeners = [];
    add(order, callback) {
        // NOTE: Optimization: we don't need to sort the listeners if the new listener
        // can be appended at the end of the list.
        // NOTE: If the sortDirty flag is already set, it means that the listeners are
        // already not sorted, so we don't need to check the order.
        // So we have to use the "or assign" operator (||=) here.
        this._sortDirty ||= this._listeners.length > 0
            && order < this._listeners[this._listeners.length - 1].order;
        this._countDirty = true;
        const id = Listeners.listenerNextId++;
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
    call(tick) {
        if (this._sortDirty) {
            this._listeners.sort((A, B) => A.order - B.order);
            this._sortDirty = false;
        }
        if (this._countDirty) {
            this._loopListeners = [...this._listeners];
            this._countDirty = false;
        }
        for (const { callback } of this._loopListeners) {
            const result = callback(tick);
            if (result === 'stop') {
                this.remove(callback);
            }
        }
    }
    clear() {
        this._listeners.length = 0;
        this._countDirty = true;
    }
}
let tickerNextId = 0;
export class Ticker {
    // Static props
    static defaultStaticProps = {
        tickMaxCount: 60,
        maxDeltaTime: 1 / 10,
    };
    // Dynamic props
    static defaultProps = {
        order: 0,
        activeDuration: 10,
        activeFadeDuration: 1,
    };
    id = tickerNextId++;
    staticProps;
    props;
    internal = {
        active: true,
        stopped: false,
        caughtErrors: false,
        timeScale: 1,
        activeLastRequest: 0,
        updateListeners: new Listeners(),
        deactivationListeners: new Listeners(),
        activationListeners: new Listeners(),
    };
    tick = new Tick();
    // Accessors:
    get time() { return this.tick.time; }
    get deltaTime() { return this.tick.deltaTime; }
    get timeScale() { return this.internal.timeScale; }
    set timeScale(value) {
        this.internal.timeScale = value;
    }
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
        tickers.push(this);
        console.log('Ticker created', this.id);
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
            console.log('Ticker destroyed', this.id);
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
    requestActivation() {
        this.internal.activeLastRequest = globalTime;
        if (this.internal.active === false) {
            this.internal.active = true;
            this.internal.activationListeners.call(this.tick);
        }
        return this;
    }
    set(props) {
        const { order, ...rest } = props;
        // Order is a special case
        if (order !== undefined) {
            this.props.order = order;
            flags.orderChanged = true;
        }
        Object.assign(this.props, rest);
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
        this.internal.updateListeners.add(order, callback);
        const destroy = () => {
            this.internal.updateListeners.remove(callback);
        };
        return { destroy, value: this };
    }
    offTick(callback) {
        return this.internal.updateListeners.remove(callback);
    }
    onActivate(callback) {
        this.requestActivation();
        this.internal.activationListeners.add(0, callback);
        const destroy = () => {
            this.internal.activationListeners.remove(callback);
        };
        return { destroy, value: this };
    }
    onDeactivate(callback) {
        this.internal.deactivationListeners.add(0, callback);
        const destroy = () => {
            this.internal.deactivationListeners.remove(callback);
        };
        return { destroy, value: this };
    }
}
const tickers = [];
const flags = {
    orderChanged: false,
};
function updateTicker(ticker) {
    const { active, activeLastRequest, stopped, timeScale } = ticker.internal;
    if (active === false || stopped) {
        return;
    }
    const { tickMaxCount, maxDeltaTime } = ticker.staticProps;
    const { activeDuration, activeFadeDuration } = ticker.props;
    const { tick: previousTick } = ticker;
    const activeTime = globalTime - activeLastRequest;
    const activeExtraTime = clamp01((activeTime - activeDuration) / activeFadeDuration);
    const activeTimeScale = 1 - activeExtraTime * activeExtraTime; // ease-out-2
    const frame = previousTick.frame + 1;
    const deltaTime = Math.min(globalDeltaTime, maxDeltaTime) * timeScale * activeTimeScale;
    const time = previousTick.time + deltaTime;
    ticker.tick = new Tick(previousTick, frame, time, deltaTime, timeScale, activeTimeScale, activeTime, activeDuration);
    let currentTick = previousTick;
    let count = 0;
    while (currentTick && ++count < tickMaxCount) {
        currentTick = currentTick.previousTick;
    }
    if (currentTick) {
        currentTick.previousTick = null; // Prevent memory leak
    }
    ticker.internal.updateListeners.call(ticker.tick);
    if (activeTimeScale === 0) {
        ticker.internal.active = false;
        ticker.internal.deactivationListeners.call(ticker.tick);
    }
}
function update(ms) {
    globalDeltaTime = (ms / 1000) - globalTime;
    globalTime += globalDeltaTime;
    globalFrame++;
    if (flags.orderChanged) {
        tickers.sort((A, B) => A.props.order - B.props.order);
        flags.orderChanged = false;
    }
    for (const ticker of tickers) {
        updateTicker(ticker);
    }
}
if (typeof window !== 'undefined') {
    function loop() {
        requestAnimationFrame(loop);
        update(performance.now());
    }
    loop();
}
