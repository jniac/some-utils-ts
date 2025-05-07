import { Memorization } from './observables/memorization';
import { DestroyableObject } from './types';
declare const stopSignals: readonly ["stop", "onTick:stop"];
export type StopSignal = typeof stopSignals[number];
export declare function isStopSignal(value: any): value is StopSignal;
export declare class Tick {
    previousTick: Tick | null;
    readonly frame: number;
    readonly time: number;
    readonly deltaTime: number;
    readonly timeScale: number;
    readonly unscaledTime: number;
    readonly unscaledDeltaTime: number;
    readonly activeTimeScale: number;
    readonly activeTime: number;
    readonly activeDuration: number;
    constructor(previousTick?: Tick | null, frame?: number, time?: number, deltaTime?: number, timeScale?: number, unscaledTime?: number, unscaledDeltaTime?: number, activeTimeScale?: number, activeTime?: number, activeDuration?: number);
    get previousTime(): number;
    /**
     * Convenient method to get the cosine of the time.
     */
    cosTime({ frequency, phase }?: {
        frequency?: number | undefined;
        phase?: number | undefined;
    }): number;
    /**
     * Convenient method to get the sine of the time.
     */
    sinTime({ frequency, phase }?: {
        frequency?: number | undefined;
        phase?: number | undefined;
    }): number;
    /**
     * Convenient method to get the cosine of the time, but the value is between 0 and 1.
     *
     * It's useful for animations combined with lerp.
     *
     * NOTE: Starts at `0.0`
     */
    cos01Time(...args: Parameters<Tick['cosTime']>): number;
    /**
     * Convenient method to get the sine of the time, but the value is between 0 and 1.
     *
     * It's useful for animations combined with lerp.
     *
     * NOTE: Starts at `0.5`
     */
    sin01Time(...args: Parameters<Tick['sinTime']>): number;
    /**
     * Convenient method to lerp between two values using the cosine of the time.
     */
    lerpCos01Time(a: number, b: number, ...args: Parameters<Tick['cosTime']>): number;
    /**
     * Convenient method to lerp between two values using the sine of the time.
     */
    lerpSin01Time(a: number, b: number, ...args: Parameters<Tick['sinTime']>): number;
    static defaultPropagateOptions: {
        /**
         * Children accessor function.
         */
        childrenAccessor: (scope: Record<string, any>) => Record<string, any> | string;
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
    propagate(root: object, options?: Partial<typeof Tick.defaultPropagateOptions>): this;
    toString(): string;
}
export type TickCallback = (tick: Tick) => (void | StopSignal);
type Listener = Readonly<{
    id: number;
    order: number;
    callback: TickCallback;
}>;
declare class ListenerRegister {
    static listenerNextId: number;
    private _sortDirty;
    private _countDirty;
    /**
     * The list of listeners. Note that this array is not called directly, but
     * it's used to store the listeners when they are added. The `_clearDirty`
     * method is used to copy the listeners to the `_lockedListeners` array only
     * when needed.
     */
    private readonly _listeners;
    /**
     * A copy of the listeners that is used to iterate over the listeners.
     */
    private _lockedListeners;
    add(order: number, callback: TickCallback): Listener;
    remove(callback: TickCallback): boolean;
    removeById(id: number): boolean;
    private _clearDirty;
    call(tick: Tick): void;
    toDebugString(): string;
    logDebugString(): void;
    clear(): void;
}
export type OnTickOptions = Partial<{
    /**
     * Order of the callback. The lower the order, the earlier the callback will be
     * called.
     */
    order: number;
    /**
     * If `timeInterval` is greater than 0, the callback will be called approximately
     * every `timeInterval` seconds.
     */
    timeInterval: number;
    /**
     * If `frameInterval` is greater than 0, the callback will be called every
     * `frameInterval` frames.
     */
    frameInterval: number;
    /**
     * If `true`, the callback will be removed after the first call.
     */
    once: boolean;
}>;
export type OnTickParameters = [OnTickOptions, TickCallback] | [TickCallback];
export declare class Ticker implements DestroyableObject {
    /**
     * Returns the current ticker (the first one). If there is no ticker, a new
     * ticker will be created.
     */
    static current(): Ticker;
    /**
     * Returns the ticker with the specified name.
     *
     * If there is no ticker with the specified name, a new one will be created.
     */
    static get(name: string, options?: {
        createIfNotFound: true;
    }): Ticker;
    static get(name: string, options: {
        createIfNotFound: false;
    }): Ticker | null;
    static defaultStaticProps: {
        /**
         * The name of the ticker. It's used identifiy the ticker, by example when
         * calling `Ticker.get(name)`.
         */
        name: string | null;
        /**
         * The maximum number of ticks that is kept in memory. If the number of ticks
         * exceeds this value, the oldest ticks will be removed.
         *
         * NOTE: Ticks are stored in a linked list, each tick has a reference to the
         * previous tick.
         */
        tickMaxCount: number;
        /**
         * The maximum deltaTime that can be used in a single tick. It's useful to
         * prevent the application from making huge jumps in time when the application
         * lags for a moment.
         */
        maxDeltaTime: number;
    };
    static defaultProps: {
        /**
         * The order of the ticker. The lower the order, the earlier the ticker will be
         * updated.
         *
         * NOTE: Listeners of the ticker have also their own order, which is used to
         * sort the listeners "inside" the ticker.
         */
        order: number;
        /**
         * The duration of the active state of the ticker. When the ticker is activated,
         * the ticker updates itself until the active duration is reached. After that,
         * the ticker deactivates itself, listeners are no more called.
         *
         * Set to `Infinity` to keep the ticker always active.
         */
        activeDuration: number;
        /**
         * The duration of the fade-out of the active state of the ticker. This allows
         * to make a smooth transition when the ticker deactivates itself (the application
         * will smoothly stop updating).
         */
        activeFadeDuration: number;
    };
    readonly id: number;
    readonly name: string;
    staticProps: typeof Ticker.defaultStaticProps;
    props: typeof Ticker.defaultProps;
    internal: {
        active: boolean;
        stopped: boolean;
        caughtErrors: boolean;
        timeScale: number;
        activeLastRequest: number;
        memorization: Memorization;
        updateRegister: ListenerRegister;
        deactivationRegister: ListenerRegister;
        activationRegister: ListenerRegister;
    };
    tick: Tick;
    get frame(): number;
    get time(): number;
    get deltaTime(): number;
    get timeScale(): number;
    set timeScale(value: number);
    get stopped(): boolean;
    set stopped(value: boolean);
    /**
     * A convenient way to get the current time in the form of an object always up-to-date (getter).
     *
     * Useful for shader uniforms.
     */
    uTime: {
        readonly value: number;
    };
    constructor(props?: Partial<typeof Ticker.defaultStaticProps & typeof Ticker.defaultProps>);
    destroyed: boolean;
    destroy: () => void;
    start(): this;
    stop(): this;
    toggle(start?: boolean): this;
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
    requestActivation: () => this;
    static defaultSetOptions: {
        requestActivation: boolean;
        minActiveDuration: number | null;
    };
    set(props: Partial<typeof Ticker.defaultProps & typeof Ticker.defaultSetOptions>): this;
    /**
     * Executes the callback on every tick (or less frequently if options are set).
     *
     * NOTE: `onTick` is bound to the ticker and can be used as a pure callback:
     * ```
     * const { onTick } = ticker
     * onTick(() => console.log('Tick'))
     * ```
     */
    onTick: (...args: OnTickParameters) => DestroyableObject;
    offTick(callback: TickCallback): boolean;
    onActivate(callback: TickCallback): DestroyableObject;
    onDeactivate(callback: TickCallback): DestroyableObject;
    /**
     * Mock of window.requestAnimationFrame, with an order option.
     *
     * It's intended to be used in the same way as window.requestAnimationFrame,
     * and helps to use the Ticker instead of window.requestAnimationFrame.
     *
     * Since an order option is available, it's possible to insert the callback
     * to a specific position among the other callbacks.
     */
    requestAnimationFrame: (callback: (ms: number) => void, { order }?: {
        order?: number | undefined;
    }) => number;
    /**
     * Mock of window.cancelAnimationFrame that works with the Ticker.
     *
     * See {@link Ticker.requestAnimationFrame}
     */
    cancelAnimationFrame(id: number): boolean;
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
    nextTick(deltaTime?: number, activeTime?: number, unscaledDeltaTime?: number): this;
    /**
     * Returns the average deltaTime of the last ticks (the last 60 ticks by default).
     */
    getAverageDeltaTime(): number;
}
/**
 * Shortcut for `Ticker.get("my-ticker").onTick(...)`.
 */
export declare function onTick(tickerName: string, ...args: OnTickParameters): DestroyableObject;
export declare function onTick(...args: OnTickParameters): DestroyableObject;
export {};
