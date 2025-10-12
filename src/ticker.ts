import { clamp01, lerp } from './math/basic'
import { Memorization } from './observables/memorization'
import { DestroyableObject } from './types'

let globalTime = 0
let globalDeltaTime = 0
let globalFrame = 0

const ON_TICK_STOP_SIGNAL_0 = 'stop'
const ON_TICK_STOP_SIGNAL_1 = 'onTick:stop'

export type OnTickStopSignal =
  | typeof ON_TICK_STOP_SIGNAL_0
  | typeof ON_TICK_STOP_SIGNAL_1

export function isOnTickStopSignal(value: any): value is OnTickStopSignal {
  if (typeof value === 'string') {
    return value === ON_TICK_STOP_SIGNAL_0 || value === ON_TICK_STOP_SIGNAL_1
  }
  return false
}

export class Tick {
  constructor(
    public previousTick: Tick | null = null,

    public readonly frame: number = 0,
    public readonly time: number = 0,
    public readonly deltaTime: number = 0,
    public readonly timeScale: number = 1,

    public readonly unscaledTime: number = 0,
    public readonly unscaledDeltaTime: number = 0,

    public readonly inactivityTimeScale: number = 1,
    public readonly inactivityTime: number = 0,
    public readonly inactivityDuration: number = Ticker.defaultProps.inactivityWaitDuration,
  ) { }

  get previousTime() {
    return this.time - this.deltaTime
  }

  /**
   * Returns the "inactivity" progress of the ticker. When `1` is reached, the 
   * ticker is considered inactive and slows down to stop.
   */
  get inactivityProgress() {
    return clamp01(this.inactivityTime / this.inactivityDuration)
  }

  /**
   * Convenient method to get the cosine of the time.
   */
  cosTime({ frequency = 1, phase = 0 } = {}) {
    return Math.cos((this.time + phase) * 2 * Math.PI * frequency)
  }

  /**
   * Convenient method to get the sine of the time.
   */
  sinTime({ frequency = 1, phase = 0 } = {}) {
    return Math.sin((this.time + phase) * 2 * Math.PI * frequency)
  }

  /**
   * Convenient method to get the cosine of the time, but the value is between 0 and 1.
   * 
   * It's useful for animations combined with lerp.
   * 
   * NOTE: Starts at `0.0`
   */
  cos01Time(...args: Parameters<Tick['cosTime']>) {
    return this.cosTime(...args) * -.5 + .5
  }

  /**
   * Convenient method to get the sine of the time, but the value is between 0 and 1.
   * 
   * It's useful for animations combined with lerp.
   * 
   * NOTE: Starts at `0.5`
   */
  sin01Time(...args: Parameters<Tick['sinTime']>) {
    return this.sinTime(...args) * .5 + .5
  }

  /**
   * Convenient method to lerp between two values using the cosine of the time.
   */
  lerpCos01Time(a: number, b: number, ...args: Parameters<Tick['cosTime']>) {
    return lerp(a, b, this.cos01Time(...args))
  }

  /**
   * Convenient method to lerp between two values using the sine of the time.
   */
  lerpSin01Time(a: number, b: number, ...args: Parameters<Tick['sinTime']>) {
    return lerp(a, b, this.sin01Time(...args))
  }

  static defaultPropagateOptions = {
    /**
     * Children accessor function.
     */
    childrenAccessor: <(scope: Record<string, any>) => Record<string, any> | string>(scope => scope.children),
  }
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
  propagate(root: object, options?: Partial<typeof Tick.defaultPropagateOptions>): this {
    const { childrenAccessor: childrenAccessorArg } = { ...Tick.defaultPropagateOptions, ...options }
    const childrenAccessor = typeof childrenAccessorArg === 'function'
      ? childrenAccessorArg
      : (scope: any) => scope[childrenAccessorArg]
    const queue = [root]
    while (queue.length > 0) {
      const object = queue.shift()!
      if (object && typeof object === 'object') {
        if ('onTick' in object) {
          (object as any)['onTick'](this)
        }
        const children = childrenAccessor(object)
        if (Array.isArray(children)) {
          queue.push(...children)
        }
      }
    }
    return this
  }

  toString() {
    return `frame: ${this.frame}, time: ${this.time.toFixed(2)}, deltaTime: ${this.deltaTime.toFixed(4)}`
  }

  // Deprecated
  /**
   * @deprecated Use "inactivity" properties instead.
   */
  get activeTimeScale() { return this.inactivityTimeScale }
  /**
   * @deprecated Use "inactivity" properties instead.
   */
  get activeTime() { return this.inactivityTime }
  /**
   * @deprecated Use "inactivity" properties instead.
   */
  get activeDuration() { return this.inactivityDuration }
}

export type TickCallback = (tick: Tick) => (void | OnTickStopSignal | Promise<void>)

const DEFAULT_LISTENER_NAME = '<anonymous>'

/**
 * Listeners are used to register callbacks that will be called on every tick.
 * 
 * They are sorted by `phase` and `order` properties. 
 * - `phase` is used to sort listeners in the first place.
 * - `order` is used to sort listeners within the same phase.
 */
type Listener = Readonly<{
  /**
   * Unique identifier of the listener.
   */
  id: number
  /**
   * Name of the listener.
   */
  name?: string
  /**
   * Phase of the listener. Used to sort the listeners.
   */
  phase: number
  /**
   * Order of the listener. Used to sort the listeners.
   */
  order: number
  /**
   * Callback of the listener.
   */
  callback: TickCallback
}>

class ListenerRegister {
  static #listenerNextId = 0

  #sortDirty = true
  #countDirty = true

  /**
   * The list of listeners. Note that this array is not called directly, but
   * it's used to store the listeners when they are added. The `_clearDirty` 
   * method is used to copy the listeners to the `_lockedListeners` array only
   * when needed.
   */
  readonly #listeners: Listener[] = []

  /**
   * A copy of the listeners that is used to iterate over the listeners.
   */
  #lockedListeners: Listener[] = []

  add(phase: number, order: number, name: string | undefined, callback: TickCallback): Listener {
    // NOTE: Optimization: we don't need to sort the listeners if the new listener
    // can be appended at the end of the list.
    // NOTE: If the sortDirty flag is already set, it means that the listeners are
    // already not sorted, so we don't need to check the order.
    // So we have to use the "or assign" operator (||=) here.
    this.#sortDirty ||= this.#listeners.length > 0 && (
      order < this.#listeners[this.#listeners.length - 1].order ||
      phase < this.#listeners[this.#listeners.length - 1].phase
    )

    this.#countDirty = true

    const id = ListenerRegister.#listenerNextId++
    const listener = { id, name, phase, order, callback }
    this.#listeners.push(listener)
    return listener
  }

  remove(callback: TickCallback): boolean {
    const index = this.#listeners.findIndex(listener => listener.callback === callback)
    if (index !== - 1) {
      this.#listeners.splice(index, 1)
      this.#countDirty = true
      return true
    } else {
      return false
    }
  }

  removeById(id: number): boolean {
    const index = this.#listeners.findIndex(listener => listener.id === id)
    if (index !== - 1) {
      this.#listeners.splice(index, 1)
      this.#countDirty = true
      return true
    } else {
      return false
    }
  }

  #clearDirty() {
    if (this.#sortDirty) {
      this.#listeners.sort((A, B) => (
        A.phase !== B.phase
          ? A.phase - B.phase
          : A.order - B.order
      ))
      this.#sortDirty = false
    }
    if (this.#countDirty) {
      this.#lockedListeners = [...this.#listeners]
      this.#countDirty = false
    }
  }

  call(tick: Tick) {
    this.#clearDirty()
    for (const { callback } of this.#lockedListeners) {
      const result = callback(tick)
      if (isOnTickStopSignal(result)) {
        this.remove(callback)
      }
    }
  }

  toDebugString() {
    this.#clearDirty()

    const phaseHeadStr = 'Phase'
    const orderHeadStr = 'Order'
    const nameHeadStr = 'Name'
    const idHeadStr = 'ID'
    let longestPhaseStr = phaseHeadStr
    let longestOrderStr = orderHeadStr
    let longestNameStr = nameHeadStr
    let longestIdStr = idHeadStr
    for (const listener of this.#lockedListeners) {
      const phaseStr = listener.phase.toString()
      const orderStr = listener.order.toString()
      const idStr = listener.id.toString()
      const nameStr = listener.name?.toString() ?? DEFAULT_LISTENER_NAME

      if (nameStr.length > longestNameStr.length)
        longestNameStr = nameStr

      if (phaseStr.length > longestPhaseStr.length)
        longestPhaseStr = phaseStr

      if (orderStr.length > longestOrderStr.length)
        longestOrderStr = orderStr

      if (idStr.length > longestIdStr.length)
        longestIdStr = idStr

      if (nameStr.length > longestNameStr.length)
        longestNameStr = nameStr
    }

    const indexLongestStr = this.#lockedListeners.length.toString()
    const separator = ' | '
    const headLine = [
      ''.padStart(indexLongestStr.length, '-'),
      phaseHeadStr.padStart(longestPhaseStr.length),
      orderHeadStr.padStart(longestOrderStr.length),
      idHeadStr.padStart(longestIdStr.length),
      nameHeadStr.padEnd(longestNameStr.length)
    ].join(separator)
    const lines = this.#lockedListeners.map((listener, index) => {
      const indexStr = (index + 1).toString().padStart(indexLongestStr.length)
      const phaseStr = listener.phase.toString().padStart(longestPhaseStr.length)
      const orderStr = listener.order.toString().padStart(longestOrderStr.length)
      const idStr = listener.id.toString().padStart(longestIdStr.length)
      const nameStr = (listener.name?.toString() ?? DEFAULT_LISTENER_NAME).padEnd(longestNameStr.length)
      return [indexStr, phaseStr, orderStr, idStr, nameStr].join(separator)
    })

    return [headLine, ...lines].join('\n')
  }

  logDebugString() {
    console.log(this.toDebugString())
  }

  clear() {
    this.#listeners.length = 0
    this.#countDirty = true
  }
}

export type OnTickOptions = Partial<{
  /**
   * Name of the listener. For debugging purposes.
   */
  name: string
  /**
   * Phase of the listener. The lower the phase, the earlier the listener will be
   * called.
   * 
   * Note:
   * - `phase` is used to sort the listeners in the first place.
   * - `order` is used to sort the listeners within the same phase.
   */
  phase: number
  /**
   * Order of the callback. The lower the order, the earlier the callback will be
   * called.
   * 
   * Note:
   * - `phase` is used to sort the listeners in the first place.
   * - `order` is used to sort the listeners within the same phase.
   */
  order: number
  /**
   * If `timeInterval` is greater than 0, the callback will be called approximately
   * every `timeInterval` seconds.
   */
  timeInterval: number
  /**
   * If `frameInterval` is greater than 0, the callback will be called every
   * `frameInterval` frames.
   */
  frameInterval: number
  /**
   * Initial delay before the callback is called for the first time, in seconds.
   */
  timeDelay: number
  /**
   * Initial delay before the callback is called for the first time, in frames.
   */
  frameDelay: number
  /**
   * If `true`, the callback will be removed after the first call.
   */
  once: boolean
}>

export type OnTickParameters = [OnTickOptions, TickCallback] | [TickCallback]

let tickerNextId = 0
export class Ticker implements DestroyableObject {
  /**
   * Returns the current ticker (the first one). If there is no ticker, a new 
   * ticker will be created.
   */
  static current() {
    const ticker = tickers.length === 0
      ? new Ticker({ name: 'CurrentTicker' })
      : tickers[tickers.length - 1]
    ticker.requestActivation()
    return ticker
  }

  /**
   * Returns the ticker with the specified name. 
   * 
   * If there is no ticker with the specified name, a new one will be created.
   */
  static get(name: string, options?: { createIfNotFound: true }): Ticker
  static get(name: string, options: { createIfNotFound: false }): Ticker | null
  static get(name: string, { createIfNotFound = true } = {}): any {
    const ticker = tickers.find(ticker => ticker.name === name)
    if (ticker) {
      return ticker
    } else {
      if (createIfNotFound) {
        const ticker = new Ticker({ name })
        ticker.requestActivation()
        return ticker
      } else {
        return null
      }
    }
  }

  // Static props
  static defaultStaticProps = {
    /**
     * The name of the ticker. It's used identifiy the ticker, by example when
     * calling `Ticker.get(name)`.
     */
    name: null as string | null,
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
  }

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
    inactivityWaitDuration: 10,
    /**
     * The duration of the fade-out of the active state of the ticker. This allows
     * to make a smooth transition when the ticker deactivates itself (the application
     * will smoothly stop updating).
     */
    inactivityFadeDuration: 4,
  }

  readonly id = tickerNextId++
  readonly name: string

  staticProps: typeof Ticker.defaultStaticProps
  props: typeof Ticker.defaultProps

  /**
   * Internal state of the ticker. Should be private but kept public for debugging purposes.
   */
  internal = {
    active: true,
    stopped: false,
    caughtErrors: false,
    timeScale: 1,
    activeLastRequest: 0,
    memorization: new Memorization(60, 1 / 60),

    updateRegister: new ListenerRegister(),
    deactivationRegister: new ListenerRegister(),
    activationRegister: new ListenerRegister(),
  }

  tick = new Tick()

  // Accessors:
  get frame() { return this.tick.frame }
  get time() { return this.tick.time }
  get deltaTime() { return this.tick.deltaTime }
  get timeScale() { return this.internal.timeScale }
  get inactivityProgress() { return this.tick.inactivityProgress }
  get inactivityTimeScale() { return this.tick.inactivityTimeScale }
  set timeScale(value: number) {
    this.internal.timeScale = value
  }
  get stopped() { return this.internal.stopped }
  set stopped(value: boolean) {
    if (value) {
      this.stop()
    } else {
      this.start()
    }
  }

  /**
   * A convenient way to get the current time in the form of an object always up-to-date (getter).
   * 
   * Useful for shader uniforms.
   */
  uTime = Object.defineProperty({}, 'value', { // NOTE: Getters can't be declared using arrow functions.
    enumerable: true,
    get: () => this.tick.time,
  }) as { readonly value: number }

  constructor(props: Partial<typeof Ticker.defaultStaticProps & typeof Ticker.defaultProps> = {}) {
    this.staticProps = { ...Ticker.defaultStaticProps }
    this.props = { ...Ticker.defaultProps }
    for (const [key, value] of Object.entries(props)) {
      if (key in this.staticProps) {
        (this.staticProps as any)[key] = value
      } else {
        (this.props as any)[key] = value
      }
    }

    this.name = this.staticProps.name ?? `Ticker#${this.id}`
    tickers.push(this)
  }

  destroyed = false
  destroy = () => {
    if (this.destroyed === false) {
      this.destroyed = true
      const index = tickers.indexOf(this)
      if (index === -1) {
        throw new Error('Ticker is already destroyed')
      }
      tickers.splice(index, 1)
    }
  }

  start(): this {
    this.internal.stopped = false
    this.requestActivation()
    return this
  }

  stop(): this {
    this.internal.stopped = true
    return this
  }

  toggle(start = this.internal.stopped): this {
    return start ? this.start() : this.stop()
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
    this.internal.activeLastRequest = globalTime
    if (this.internal.active === false) {
      this.internal.active = true
      this.internal.activationRegister.call(this.tick)
    }
    return this
  }

  static defaultSetOptions = {
    requestActivation: true,
    inactivityWaitDurationMinimum: <number | null>null,
    /**
     * @deprecated Use `inactivityWaitDurationMinimum` instead.
     */
    minActiveDuration: <number | null>null,
    /**
     * @deprecated Use `inactivityWaitDuration` instead.
     */
    activeDuration: <number | null>null,
    /**
     * @deprecated Use `inactivityFadeDuration` instead.
     */
    activeFadeDuration: <number | null>null,
  }
  set(props: Partial<typeof Ticker.defaultProps & typeof Ticker.defaultSetOptions>): this {
    const {
      activeDuration,
      minActiveDuration,
      activeFadeDuration,

      requestActivation,
      inactivityWaitDurationMinimum = minActiveDuration,
      order,

      ...rest
    } = { ...Ticker.defaultSetOptions, ...props }

    // Order is a special case
    if (order !== undefined) {
      this.props.order = order
      flags.orderChanged = true
    }

    // Handle deprecated properties
    if (activeDuration !== null)
      this.props.inactivityWaitDuration = activeDuration
    if (activeFadeDuration !== null)
      this.props.inactivityFadeDuration = activeFadeDuration

    // Minimum inactivity wait duration
    if (inactivityWaitDurationMinimum !== null)
      this.props.inactivityWaitDuration = Math.max(this.props.inactivityWaitDuration, inactivityWaitDurationMinimum)

    Object.assign(this.props, rest)

    if (requestActivation)
      this.requestActivation()

    return this
  }

  /**
   * Executes the callback on every tick (or less frequently if options are set).
   * 
   * NOTE: `onTick` is bound to the ticker and can be used as a pure callback:
   * ```
   * const { onTick } = ticker
   * onTick(() => console.log('Tick'))
   * ```
   */
  onTick = (...args: OnTickParameters): DestroyableObject => {
    function solveArgs(args: any[]): [OnTickOptions, TickCallback] {
      if (args.length === 1) {
        return [{}, args[0]]
      }
      if (typeof args[0] === 'number') {
        return [{ order: args[0] }, args[1]]
      }
      return args as any
    }

    const [options, callback] = solveArgs(args)
    const {
      phase = 0,
      order = 0,
      name = undefined,
      frameInterval = 0,
      timeInterval = 0,
      timeDelay = 0,
      frameDelay = 0,
      once = false,
    } = options

    if (once) {
      const listener = this.onTick({ ...options, once: false }, tick => {
        listener.destroy()
        callback(tick)
      })
      return listener
    }

    // NOTE: timeDelay and frameDelay currently involve a bit of overhead (a check per tick).
    // But they are not expected to be used a lot, so it's acceptable.
    // Possible optimization would be to have a different callback for the waiting phase,
    // but since cancelling must be supported whatever the waiting phase, it would complicate
    // a bit the implementation.
    if (timeDelay > 0) {
      let initialTime = this.tick.time
      return this.onTick({ ...options, timeDelay: 0 }, tick => {
        const deltaTime = tick.time - initialTime
        if (deltaTime >= timeDelay) {
          return callback(tick)
        }
      })
    }

    if (frameDelay > 0) {
      let initialFrame = this.tick.frame
      return this.onTick({ ...options, frameDelay: 0 }, tick => {
        const deltaFrame = tick.frame - initialFrame
        if (deltaFrame >= frameDelay) {
          return callback(tick)
        }
      })
    }

    if (frameInterval > 0) {
      let frame = 0
      return this.onTick({ order }, tick => {
        const lastTickBeforeInactivity = tick.inactivityTimeScale === 0
        const shoudCallback = (frame % frameInterval) === 0
        frame++
        if (lastTickBeforeInactivity || shoudCallback) {
          return callback(tick)
        }
      })
    }

    if (timeInterval > 0) {
      let cumulativeTime = timeInterval
      return this.onTick({ order }, tick => {
        const lastTickBeforeInactivity = tick.inactivityTimeScale === 0
        const shoudCallback = cumulativeTime <= 0
        cumulativeTime = cumulativeTime + tick.deltaTime > timeInterval
          ? cumulativeTime - timeInterval
          : cumulativeTime + tick.deltaTime
        if (lastTickBeforeInactivity || shoudCallback) {
          return callback(tick)
        }
      })
    }

    this.internal.updateRegister.add(phase, order, name, callback)
    this.internal.deactivationRegister
    const destroy = () => {
      this.internal.updateRegister.remove(callback)
    }

    return { destroy, value: this }
  }

  offTick(callback: TickCallback): boolean {
    return this.internal.updateRegister.remove(callback)
  }

  onActivate(callback: TickCallback): DestroyableObject {
    this.requestActivation()
    this.internal.activationRegister.add(0, 0, undefined, callback)
    const destroy = () => {
      this.internal.activationRegister.remove(callback)
    }
    return { destroy, value: this }
  }

  onDeactivate(callback: TickCallback): DestroyableObject {
    this.internal.deactivationRegister.add(0, 0, undefined, callback)
    const destroy = () => {
      this.internal.deactivationRegister.remove(callback)
    }
    return { destroy, value: this }
  }

  /**
   * Mock of window.requestAnimationFrame, with an order option.
   *
   * It's intended to be used in the same way as window.requestAnimationFrame,
   * and helps to use the Ticker instead of window.requestAnimationFrame.
   *
   * Since `phase` and `order` options are available, it's possible to insert the callback
   * to a specific position among the other callbacks.
   */
  requestAnimationFrame = (callback: (ms: number) => void, { phase = 0, order = 0, name = <string | undefined>undefined } = {}): number => {
    this.requestActivation() // Request activation to ensure the callback is called.
    const { updateRegister: updateListeners } = this.internal
    const listener = updateListeners.add(phase, order, name, tick => {
      updateListeners.removeById(listener.id)
      callback(tick.time * 1e3)
    })
    return listener.id
  }

  /**
   * Mock of window.cancelAnimationFrame that works with the Ticker.
   *
   * See {@link Ticker.requestAnimationFrame}
   */
  cancelAnimationFrame(id: number): boolean {
    const { updateRegister: updateListeners } = this.internal
    return updateListeners.removeById(id)
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
   * @param inactivityTime The current "inactive" time. It's the time that has passed since the ticker was activated OR the last request of activation. It's used internally to calculate the inactivityTimeScale. For manual use, `0` can be passed.
   * @returns 
   */
  nextTick(deltaTime = 1 / 60, inactivityTime = 0, unscaledDeltaTime = deltaTime): this {
    const { timeScale } = this.internal
    const { tickMaxCount } = this.staticProps
    const { inactivityWaitDuration, inactivityFadeDuration } = this.props

    const { tick: previousTick } = this

    const inactivityExtraTime = clamp01((inactivityTime - inactivityWaitDuration) / inactivityFadeDuration)
    const inactivityTimeScale = 1 - inactivityExtraTime * inactivityExtraTime // ease-out-2

    const frame = previousTick.frame + 1
    const time = previousTick.time + deltaTime
    const unscaledTime = previousTick.unscaledTime + unscaledDeltaTime

    this.internal.memorization.setValue(unscaledDeltaTime, true)

    this.tick = new Tick(
      previousTick,
      frame,

      time,
      deltaTime,
      timeScale,

      unscaledTime,
      unscaledDeltaTime,

      inactivityTimeScale,
      inactivityTime,
      inactivityWaitDuration,
    )

    let currentTick: Tick | null = previousTick
    let count = 0
    while (currentTick && ++count < tickMaxCount) {
      currentTick = currentTick.previousTick
    }
    if (currentTick) {
      currentTick.previousTick = null // Prevent memory leak
    }

    try {
      this.internal.updateRegister.call(this.tick)
    } catch (error) {
      console.error(`Error in Ticker "${this.name}"`)
      console.error(this.tick.toString())
      console.error(error)
      this.internal.caughtErrors = true
    }

    if (inactivityTimeScale === 0) {
      this.internal.active = false
      this.internal.deactivationRegister.call(this.tick)
    }

    return this
  }

  /**
   * Returns the average deltaTime of the last ticks (the last 60 ticks by default).
   */
  get averageDeltaTime() {
    return this.internal.memorization.average
  }

  /**
   * Returns the average FPS of the last ticks (the last 60 ticks by default).
   */
  get averageFps() {
    const averageDeltaTime = this.internal.memorization.average
    return averageDeltaTime > 0 ? 1 / averageDeltaTime : 0
  }

  /**
   * Waits for the next tick and returns it.
   */
  waitNextTick(): Promise<Tick> {
    return new Promise(resolve => {
      const listener = this.onTick(tick => {
        listener.destroy()
        resolve(tick)
      })
    })
  }

  /**
   * Waits for a specific number of seconds and returns the tick when the time is reached.
   * 
   * @param seconds The number of seconds to wait for.
   */
  waitForSeconds(seconds: number): Promise<Tick> {
    return new Promise(resolve => {
      const startTime = this.tick.time
      const listener = this.onTick(tick => {
        if (tick.time - startTime >= seconds) {
          listener.destroy()
          resolve(tick)
        }
      })
    })
  }
}

const tickers: Ticker[] = []

const flags = {
  orderChanged: false,
}

function update(ms: number) {
  globalDeltaTime = (ms / 1000) - globalTime
  globalTime += globalDeltaTime
  globalFrame++

  if (flags.orderChanged) {
    tickers.sort((A, B) => A.props.order - B.props.order)
    flags.orderChanged = false
  }

  for (const ticker of tickers) {
    const { active, activeLastRequest, stopped, timeScale, caughtErrors } = ticker.internal

    if (caughtErrors || active === false || stopped) {
      return
    }

    const { maxDeltaTime } = ticker.staticProps
    const { inactivityWaitDuration, inactivityFadeDuration } = ticker.props

    const inactivityTime = globalTime - activeLastRequest - globalDeltaTime
    const inactivityExtraTime = clamp01((inactivityTime - inactivityWaitDuration) / inactivityFadeDuration)
    const inactivityTimeScale = 1 - inactivityExtraTime ** 2 // ease-out-2

    let unscaledDeltaTime = Math.min(globalDeltaTime, maxDeltaTime)

    // Smooth deltaTime
    unscaledDeltaTime = lerp(ticker.tick.unscaledDeltaTime, unscaledDeltaTime, .05)

    const deltaTime = unscaledDeltaTime * timeScale * inactivityTimeScale

    ticker.nextTick(deltaTime, inactivityTime, unscaledDeltaTime)
  }
}

function windowLoop() {
  window.requestAnimationFrame(windowLoop)
  update(performance.now())
}

if (typeof window !== 'undefined') {
  windowLoop()
}

/**
 * Shortcut for `Ticker.get("my-ticker").onTick(...)`.
 */
export function onTick(tickerName: string, ...args: OnTickParameters): DestroyableObject
export function onTick(...args: OnTickParameters): DestroyableObject
export function onTick(...args: any[]): DestroyableObject {
  if (typeof args[0] === 'string') {
    const ticker = Ticker.get(args[0], { createIfNotFound: true })
    // @ts-ignore
    return ticker.onTick(...args.slice(1))
  }

  // @ts-ignore
  return Ticker.current().onTick(...args)
}
