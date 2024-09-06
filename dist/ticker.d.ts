import { DestroyableObject } from './types';
declare class Tick {
    previousTick: Tick | null;
    readonly frame: number;
    readonly time: number;
    readonly deltaTime: number;
    readonly timeScale: number;
    readonly activeTimeScale: number;
    readonly activeTime: number;
    readonly activeDuration: number;
    constructor(previousTick?: Tick | null, frame?: number, time?: number, deltaTime?: number, timeScale?: number, activeTimeScale?: number, activeTime?: number, activeDuration?: number);
}
type TickCallback = (tick: Tick) => void | 'stop';
type Listener = Readonly<{
    id: number;
    order: number;
    callback: TickCallback;
}>;
declare class Listeners {
    static listenerNextId: number;
    private _sortDirty;
    private _countDirty;
    private readonly _listeners;
    private _loopListeners;
    add(order: number, callback: TickCallback): Listener;
    remove(callback: TickCallback): boolean;
    removeById(id: number): boolean;
    call(tick: Tick): void;
    clear(): void;
}
type OnTickOptions = Partial<{
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
export declare class Ticker implements DestroyableObject {
    static defaultStaticProps: {
        tickMaxCount: number;
        maxDeltaTime: number;
    };
    static defaultProps: {
        order: number;
        activeDuration: number;
        activeFadeDuration: number;
    };
    staticProps: typeof Ticker.defaultStaticProps;
    props: typeof Ticker.defaultProps;
    internal: {
        active: boolean;
        stopped: boolean;
        caughtErrors: boolean;
        timeScale: number;
        activeLastRequest: number;
        updateListeners: Listeners;
        deactivationListeners: Listeners;
        activationListeners: Listeners;
    };
    tick: Tick;
    constructor(props?: Partial<typeof Ticker.defaultStaticProps & typeof Ticker.defaultProps>);
    destroyed: boolean;
    destroy: () => void;
    requestActivation(): this;
    set(props: Partial<typeof Ticker.defaultProps>): this;
    onTick(callback: TickCallback): DestroyableObject;
    onTick(options: OnTickOptions, callback: TickCallback): DestroyableObject;
    offTick(callback: TickCallback): boolean;
}
export {};
