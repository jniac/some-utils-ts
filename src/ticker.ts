import { clamp01 } from './math/basic'
import { DestroyableObject } from './types'

let globalTime = 0
let globalDeltaTime = 0
let globalFrame = 0

class Tick {
  constructor(
    public previousTick: Tick | null = null,

    public readonly frame: number = 0,
    public readonly time: number = 0,
    public readonly deltaTime: number = 0,
    public readonly timeScale: number = 1,

    public readonly activeTimeScale: number = 1,
    public readonly activeTime: number = 0,
    public readonly activeDuration: number = Ticker.defaultProps.activeDuration,
  ) { }

  get previousTime() {
    return this.time - this.deltaTime
  }

  toString() {
    return `frame: ${this.frame}, time: ${this.time.toFixed(2)}, deltaTime: ${this.deltaTime.toFixed(4)}`
  }
}

type TickCallback = (tick: Tick) => void | 'stop'

type Listener = Readonly<{
  id: number
  order: number
  callback: TickCallback
}>

class Listeners {
  static listenerNextId = 0
  private _sortDirty = true
  private _countDirty = true
  private readonly _listeners: Listener[] = []
  private _loopListeners: Listener[] = []

  add(order: number, callback: TickCallback): Listener {
    // NOTE: Optimization: we don't need to sort the listeners if the new listener
    // can be appended at the end of the list.
    // NOTE: If the sortDirty flag is already set, it means that the listeners are
    // already not sorted, so we don't need to check the order.
    // So we have to use the "or assign" operator (||=) here.
    this._sortDirty ||= this._listeners.length > 0
      && order < this._listeners[this._listeners.length - 1].order

    this._countDirty = true

    const id = Listeners.listenerNextId++
    const listener = { id, order, callback }
    this._listeners.push(listener)
    return listener
  }

  remove(callback: TickCallback): boolean {
    const index = this._listeners.findIndex(listener => listener.callback === callback)
    if (index !== - 1) {
      this._listeners.splice(index, 1)
      this._countDirty = true
      return true
    } else {
      return false
    }
  }

  removeById(id: number): boolean {
    const index = this._listeners.findIndex(listener => listener.id === id)
    if (index !== - 1) {
      this._listeners.splice(index, 1)
      this._countDirty = true
      return true
    } else {
      return false
    }
  }

  call(tick: Tick) {
    if (this._sortDirty) {
      this._listeners.sort((A, B) => A.order - B.order)
      this._sortDirty = false
    }
    if (this._countDirty) {
      this._loopListeners = [...this._listeners]
      this._countDirty = false
    }
    for (const { callback } of this._loopListeners) {
      const result = callback(tick)
      if (result === 'stop') {
        this.remove(callback)
      }
    }
  }

  clear() {
    this._listeners.length = 0
    this._countDirty = true
  }
}

type OnTickOptions = Partial<{
  /**
   * Order of the callback. The lower the order, the earlier the callback will be
   * called.
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
   * If `true`, the callback will be removed after the first call.
   */
  once: boolean
}>

let tickerNextId = 0
export class Ticker implements DestroyableObject {
  // Static props
  static defaultStaticProps = {
    tickMaxCount: 60,
    maxDeltaTime: 1 / 10,
  }
  // Dynamic props
  static defaultProps = {
    order: 0,
    activeDuration: 10,
    activeFadeDuration: 1,
  }

  readonly id = tickerNextId++

  staticProps: typeof Ticker.defaultStaticProps
  props: typeof Ticker.defaultProps

  internal = {
    active: true,
    stopped: false,
    caughtErrors: false,
    timeScale: 1,
    activeLastRequest: 0,

    updateListeners: new Listeners(),
    deactivationListeners: new Listeners(),
    activationListeners: new Listeners(),
  }

  tick = new Tick()

  // Accessors:
  get time() { return this.tick.time }
  get deltaTime() { return this.tick.deltaTime }
  get timeScale() { return this.internal.timeScale }
  set timeScale(value: number) {
    this.internal.timeScale = value
  }

  constructor(props: Partial<typeof Ticker.defaultStaticProps & typeof Ticker.defaultProps> = {}) {
    this.staticProps = { ...Ticker.defaultStaticProps }
    this.props = { ...Ticker.defaultProps }
    for (const [key, value] of Object.entries(props)) {
      if (key in this.staticProps) {
        this.staticProps[key as keyof typeof Ticker.defaultStaticProps] = value
      } else {
        this.props[key as keyof typeof Ticker.defaultProps] = value
      }
    }

    tickers.push(this)
    console.log('Ticker created', this.id)
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
      console.log('Ticker destroyed', this.id)
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

  /**
   * `requestActivation()` is binded to the ticker and can be used as a pure callback.
   */
  requestActivation = () => {
    this.internal.activeLastRequest = globalTime
    if (this.internal.active === false) {
      this.internal.active = true
      this.internal.activationListeners.call(this.tick)
    }
    return this
  }

  set(props: Partial<typeof Ticker.defaultProps>): this {
    const { order, ...rest } = props

    // Order is a special case
    if (order !== undefined) {
      this.props.order = order
      flags.orderChanged = true
    }

    Object.assign(this.props, rest)

    return this
  }

  onTick(callback: TickCallback): DestroyableObject
  onTick(options: OnTickOptions, callback: TickCallback): DestroyableObject
  onTick(...args: any[]): DestroyableObject {
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
      order = 0,
      frameInterval = 0,
      timeInterval = 0,
      once = false,
    } = options

    if (once) {
      const listener = this.onTick({ ...options, once: false }, tick => {
        listener.destroy()
        callback(tick)
      })
      return listener
    }

    if (frameInterval > 0) {
      return this.onTick({ order }, tick => {
        if (tick.frame % frameInterval === 0) {
          return callback(tick)
        }
      })
    }

    if (timeInterval > 0) {
      let cumulativeTime = timeInterval
      return this.onTick({ order }, tick => {
        cumulativeTime += tick.deltaTime
        if (cumulativeTime >= timeInterval) {
          cumulativeTime += -timeInterval
          return callback(tick)
        }
      })
    }

    this.internal.updateListeners.add(order, callback)
    const destroy = () => {
      this.internal.updateListeners.remove(callback)
    }

    return { destroy, value: this }
  }

  offTick(callback: TickCallback): boolean {
    return this.internal.updateListeners.remove(callback)
  }

  onActivate(callback: TickCallback): DestroyableObject {
    this.requestActivation()
    this.internal.activationListeners.add(0, callback)
    const destroy = () => {
      this.internal.activationListeners.remove(callback)
    }
    return { destroy, value: this }
  }

  onDeactivate(callback: TickCallback): DestroyableObject {
    this.internal.deactivationListeners.add(0, callback)
    const destroy = () => {
      this.internal.deactivationListeners.remove(callback)
    }
    return { destroy, value: this }
  }
}

const tickers: Ticker[] = []

const flags = {
  orderChanged: false,
}

function updateTicker(ticker: Ticker) {
  const { active, activeLastRequest, stopped, timeScale } = ticker.internal

  if (active === false || stopped) {
    return
  }

  const { tickMaxCount, maxDeltaTime } = ticker.staticProps
  const { activeDuration, activeFadeDuration } = ticker.props

  const { tick: previousTick } = ticker

  const activeTime = globalTime - activeLastRequest
  const activeExtraTime = clamp01((activeTime - activeDuration) / activeFadeDuration)
  const activeTimeScale = 1 - activeExtraTime * activeExtraTime // ease-out-2

  const frame = previousTick.frame + 1
  const deltaTime = Math.min(globalDeltaTime, maxDeltaTime) * timeScale * activeTimeScale
  const time = previousTick.time + deltaTime

  ticker.tick = new Tick(
    previousTick,
    frame,
    time,
    deltaTime,
    timeScale,
    activeTimeScale,
    activeTime,
    activeDuration,
  )

  let currentTick: Tick | null = previousTick
  let count = 0
  while (currentTick && ++count < tickMaxCount) {
    currentTick = currentTick.previousTick
  }
  if (currentTick) {
    currentTick.previousTick = null // Prevent memory leak
  }

  ticker.internal.updateListeners.call(ticker.tick)

  if (activeTimeScale === 0) {
    ticker.internal.active = false
    ticker.internal.deactivationListeners.call(ticker.tick)
  }
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
    updateTicker(ticker)
  }
}

if (typeof window !== 'undefined') {
  function loop() {
    requestAnimationFrame(loop)
    update(performance.now())
  }
  loop()
}