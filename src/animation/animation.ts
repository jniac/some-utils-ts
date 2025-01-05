import { MultiKeyWeakMap } from '../collection/multi-key-map'
import { clamp, clamp01 } from '../math/basic'
import { isObject } from '../object/common'
import { expandObject } from '../object/expand'
import { omit } from '../object/misc'
import { DestroyableObject } from '../types'
import { EaseDeclaration, parseEase, remap } from './easing'


/**
 * The safeword, when returned by a callback, stops the animation. 
 * 
 * Sometimes it's “red”, sometimes “yellow”, but here it's simply "pause" or "destroy".
 */
const safewords = ['pause', 'destroy'] as const

type Safeword = typeof safewords[number]

type Callback = (animation: AnimationInstance) => void | Safeword

class MultiValueMap<K, V> {
  static empty = [][Symbol.iterator]()
  map = new Map<K, Set<V>>()
  add(key: K, value: V) {
    const create = (key: K): Set<V> => {
      const set = new Set<V>()
      this.map.set(key, set)
      return set
    }
    const set = this.map.get(key) ?? create(key)
    set.add(value)
  }
  clear(key: K) {
    this.map.get(key)?.clear()
  }
  get(key: K): IterableIterator<V> {
    return this.map.get(key)?.[Symbol.iterator]() ?? MultiValueMap.empty
  }
}

const onUpdate = new MultiValueMap<number, Callback>()
const onDestroy = new MultiValueMap<number, Callback>()

const instanceMultiKeyWeakMap = new MultiKeyWeakMap<any, Set<AnimationInstance>>()

let animationInstanceCounter = 0
class AnimationInstance implements DestroyableObject {
  readonly id = animationInstanceCounter++

  readonly duration: number
  readonly delay: number
  readonly target: any
  readonly prerun: boolean
  readonly autoDestroy: boolean

  destroyHasBeenRequested: boolean = false

  unclampedTime: number
  unclampedTimeOld: number
  frame: number
  timeScale: number

  paused: boolean = false

  // Computed "user-destinated" values.
  time: number = 0
  timeOld: number = 0
  progress: number = 0

  // Accessors:
  get progressOld() { return this.timeOld / this.duration }
  get complete() { return this.progress === 1 }
  get delayed() { return this.unclampedTime < 0 }
  get deltaTime() { return this.time - this.timeOld }

  constructor(duration: number, delay: number, timeScale: number, target: any, autoDestroy: boolean, prerun: boolean | undefined) {
    this.duration = duration
    this.delay = delay
    this.frame = 0
    this.timeScale = timeScale
    this.unclampedTimeOld =
      this.unclampedTime = -delay
    this.target = target
    this.autoDestroy = autoDestroy
    this.prerun = prerun ?? delay > 0 // prerun if delay is set.
  }

  onUpdate(callback: Callback): this {
    onUpdate.add(this.id, callback)
    return this
  }

  onComplete(callback: Callback): this {
    return this.onUpdate(() => {
      if (this.progress === 1) {
        callback(this)
      }
    })
  }

  onDestroy(callback: Callback): this {
    onDestroy.add(this.id, callback)
    return this
  }

  /**
   * Request the instance to be destroyed.
   * 
   * NOTE: The instance is not destroyed immediately, it will be destroyed:
   * - at the end of the current update loop (if inside an update loop)
   * - at the end of the next update loop (if outside an update loop, callbacks will be ignored)
   */
  requestDestroy() {
    this.destroyHasBeenRequested = true
  }

  /**
   * Call internally the `requestDestroy` method. Here to implement the `DestroyableObject` interface.
   * 
   * NOTE: The instance is not destroyed immediately, it will be destroyed as soon as possible, callbacks will be ignored.
   */
  destroy = () => this.requestDestroy()

  // Facilitators:
  /**
   * Lerps the current progress value.
   * 
   * Usage:
   * ```
   * Animation
   *   .during(1)
   *   .onUpdate(({ progressLerp }) => {
   *     const alpha = progressLerp(.75, 1, 'cubic-bezier(.33, 0, .66, 1)')
   *   })
   * ```
   */
  progressLerp = (from: number, to: number, ease: EaseDeclaration = 'linear') => {
    const alpha = parseEase(ease)(this.progress)
    return from + (to - from) * alpha
  }

  set({ paused, time, progress, timeScale, delay }: Partial<{
    paused: boolean
    time: number
    progress: number
    timeScale: number
    delay: number
  }> = {}) {
    if (progress !== undefined && Number.isFinite(progress)) {
      time = progress * this.duration
    }

    if (time !== undefined && Number.isFinite(time)) {
      this.unclampedTime = time
    }

    if (paused !== undefined) {
      this.paused = paused
    }

    if (timeScale !== undefined) {
      this.timeScale = timeScale
    }

    // NOTE: Order matters, `delay` must be applied after `timeScale`.
    if (delay !== undefined) {
      this.applyDelay(delay)
    }

    return this
  }

  /**
   * Applies a delay to the instance. Quite tricky.
   * 
   * Delay is handled by setting the `unclampedTime` value out of the bounds of 
   * the duration. If the time scale is positive, the time is set to `-delay`,
   * if the time scale is negative, the time is set to `duration + delay`.
   */
  applyDelay(value: number): this {
    if (this.timeScale > 0) {
      this.unclampedTime = -value
    } else {
      this.unclampedTime = this.duration + value
    }
    return this
  }

  /**
   * Pauses the instance.
   * 
   * Convenient method to set `paused` to `true`, equivalent to:
   * ```
   * instance.set({ paused: true })
   * ```
   */
  pause(props?: number | Parameters<AnimationInstance['set']>[0]) {
    if (typeof props === 'number') {
      props = { time: props }
    }
    return this.set({ ...props, paused: true })
  }

  /**
   * Resumes the instance.
   * 
   * Convenient method to set `paused` to `false`, equivalent to:
   * ```
   * instance.set({ paused: false })
   * ```
   */
  play(props?: number | Parameters<AnimationInstance['set']>[0]) {
    if (typeof props === 'number') {
      props = { time: props }
    }
    return this.set({ ...props, paused: false })
  }

  reverse(props?: number | Parameters<AnimationInstance['set']>[0]) {
    if (typeof props === 'number') {
      props = { time: props }
    }
    return this.set({ ...props, timeScale: -this.timeScale })
  }

  /**
   * By design, to avoid conflicts between "above" and "below" methods: 
   * - "above" is true when the time/progress is above or equal to the given value.
   * - "below" is true when the time/progress is strictly below the given value.
   */
  didPassAbove(props: Partial<{ time: number, progress: number }>) {
    const { time, progress } = props
    if (time !== undefined) {
      return this.timeOld < time && this.time >= time
    }
    if (progress !== undefined) {
      return this.progressOld < progress && this.progress >= progress
    }
    return false
  }

  /**
   * By design, to avoid conflicts between "above" and "below" methods: 
   * - "above" is true when the time/progress is above or equal to the given value.
   * - "below" is true when the time/progress is strictly below the given value.
   */
  didPassBelow(props: Partial<{ time: number, progress: number }>) {
    const { time, progress } = props
    if (time !== undefined) {
      return this.timeOld >= time && this.time < time
    }
    if (progress !== undefined) {
      return this.progressOld >= progress && this.progress < progress
    }
    return false
  }

  didPass(props: Partial<{ time: number, progress: number }>) {
    return this.didPassAbove(props) || this.didPassBelow(props)
  }
}

let instances: AnimationInstance[] = []

const destroyInstance = (instance: AnimationInstance) => {
  for (const callback of onDestroy.get(instance.id)) {
    callback(instance)
  }
  onUpdate.clear(instance.id)
  onDestroy.clear(instance.id)
  releaseInstanceFromTarget(instance)
}

const clearExistingInstancesForTarget = (target: any) => {
  const targetInstances = instanceMultiKeyWeakMap.get(target)
  if (targetInstances) {
    for (const instance of targetInstances) {
      instance.requestDestroy()
    }
  }
}

function releaseInstanceFromTarget(instance: AnimationInstance) {
  const { target } = instance
  if (target !== undefined) {
    const targetInstances = instanceMultiKeyWeakMap.get(target)
    if (targetInstances) {
      targetInstances.delete(instance)
      if (targetInstances.size === 0) {
        instanceMultiKeyWeakMap.delete(target)
      }
    }
  }
}

function associateInstanceWithTarget(instance: AnimationInstance) {
  const { target } = instance
  if (target !== undefined) {
    let targetInstances = instanceMultiKeyWeakMap.get(target)
    if (targetInstances === undefined) {
      targetInstances = new Set()
      instanceMultiKeyWeakMap.set(target, targetInstances)
    }
    targetInstances.add(instance)
  }
}

const registerInstance = <T extends AnimationInstance>(clearExistingInstances: boolean, instance: T): T => {
  ensureAnimationLoop()
  const { target } = instance
  if (target !== undefined) {
    if (clearExistingInstances) {
      clearExistingInstancesForTarget(target)
    }
    associateInstanceWithTarget(instance)
  }
  instances.push(instance)
  return instance
}

const updateInstances = (deltaTime: number) => {
  for (let i = 0, max = instances.length; i < max; i++) {
    const instance = instances[i]

    // Skip destroyed instances.
    if (instance.destroyHasBeenRequested) {
      continue
    }

    const requireTimeUpdate = instance.paused === false
      && (instance.timeScale > 0 ? instance.unclampedTime < instance.duration : instance.unclampedTime > 0)

    if (requireTimeUpdate) {
      instance.unclampedTime += deltaTime * instance.timeScale
    }

    instance.timeOld = instance.time
    instance.time = clamp(instance.unclampedTime, 0, instance.duration)

    instance.progress = Number.isFinite(instance.duration)
      ? clamp01(instance.time / instance.duration)
      : 0 // progress is zero on infinite animation.

    const hasChanged =
      // Check if the unclamped time has changed is not enough, because the time
      // can be outside the bounds of the duration (negative or above)...
      instance.unclampedTime !== instance.unclampedTimeOld && (
        // ... we must also check if the time is within the bounds of the duration.
        // The old and the current value must be tested both:
        // - old: to ensure the instance is updated at least once when the bounds are reached (progress === 0 or 1)
        // - current: to ensure the instance is updated when "seek" occurs.
        (instance.unclampedTimeOld >= 0 && instance.unclampedTimeOld <= instance.duration)
        || (instance.unclampedTime >= 0 && instance.unclampedTime <= instance.duration)
      )

    const isPreRunning = instance.frame === 0 && instance.prerun
    if (hasChanged || isPreRunning) {
      for (const callback of onUpdate.get(instance.id)) {
        const returnedValue = callback(instance)
        switch (returnedValue) {
          case 'pause':
            instance.pause()
            break
          case 'destroy':
            instance.requestDestroy()
            break
        }
        instance.frame++
      }
    }

    instance.unclampedTimeOld = instance.unclampedTime
  }

  const instancesToBeDestroyed = new Set<AnimationInstance>()
  instances = instances.filter(instance => {
    if (instance.destroyHasBeenRequested || (instance.autoDestroy && instance.complete)) {
      instancesToBeDestroyed.add(instance)
      return false
    }
    return true
  })

  for (const instance of instancesToBeDestroyed) {
    destroyInstance(instance)
  }
}

let loopId = -1
let animationLoopStarted = false
function ensureAnimationLoop() {
  if (animationLoopStarted === false) {
    startAnimationLoop()
  }
}
function startAnimationLoop() {
  animationLoopStarted = true
  let msOld = window.performance.now()
  const loop = (ms: number) => {
    loopId = window.requestAnimationFrame(loop)
    const deltaTime = (-msOld + (msOld = ms)) / 1e3
    updateInstances(deltaTime)
  }
  loopId = window.requestAnimationFrame(loop)
}

function stopAnimationLoop() {
  window.cancelAnimationFrame(loopId)
}



// The public API:

// --------------[  Get  ]--------------- //
function existing(...targets: any[]): AnimationInstance[] {
  const result = []
  for (const target of targets) {
    const targetInstances = instanceMultiKeyWeakMap.get(target)
    if (targetInstances) {
      result.push(...targetInstances)
    }
  }
  return result
}

// --------------[ Clear ]--------------- //

function clear(...targets: any[]) {
  for (const target of targets) {
    clearExistingInstancesForTarget(target)
  }
  return AnimationModule
}


// --------------[ During ]--------------- //
const defaultDuringArg = {
  /**
   * Duration in seconds.
   */
  duration: 1,
  /**
   * Delay in seconds.
   */
  delay: 0,
  /**
   * Time scale.
   */
  timeScale: 1,
  /**
   * Target, if an instance is associated with a target, it will be destroyed 
   * when a new instance is created for the same target.
   * 
   * Target can be any value or a combination of values:
   * - `[myObject, 'myProperty']` won't conflict with `[myObject, 'myOtherProperty']`
   */
  target: <any>undefined,
  /**
   * If true, any previous instance associated with the target will be destroyed.
   * 
   * Defaults to `false`.
   */
  clear: false,
  /**
   * If true, the instance will be destroyed when it completes.
   * 
   * If the animation is meant to be played again, set this to `false`.
   * 
   * Defaults to `true`.
   */
  autoDestroy: true,
  /**
   * If true, the instance will be updated on the first frame.
   * 
   * Defaults to the delay value (if any delay is set prerun will be set to true, otherwise it will be false).
   */
  prerun: <undefined | boolean>undefined,
}

type DuringArg = Partial<typeof defaultDuringArg>

/**
 * 
 * @param duration duration in seconds
 */
function during(arg: DuringArg | number): AnimationInstance {
  if (typeof arg === 'number') {
    arg = { duration: arg }
  }
  const { clear, duration, delay, timeScale, target, autoDestroy, prerun } = { ...defaultDuringArg, ...arg }
  return registerInstance(clear, new AnimationInstance(duration, delay, timeScale, target, autoDestroy, prerun))
}



// --------------[ Tween ]--------------- //

const defaultTweenArg = {
  ...omit(defaultDuringArg, 'target'),
  ease: <EaseDeclaration | ((x: number) => number)>'inOut2',
}

type TweenEntry = {
  from: number
  to: number
  target: Record<string, any>
  key: string
}

function createTweenEntries(target: any, from: any, to: any, entries: TweenEntry[] = []): TweenEntry[] {
  if (Array.isArray(target)) {
    for (let index = 0, length = target.length; index < length; index++) {
      createTweenEntries(target[index], from, to, entries)
    }
    return entries
  }
  if (isObject(target) === false || isObject(from ?? to) === false) {
    // No possible tween, just ignore.
    return entries
  }
  for (const key in (from ?? to)) {
    const valueFrom = (from ?? target)[key]
    const valueTo = (to ?? target)[key]
    if (isObject(valueTo)) {
      if (isObject(valueFrom) === false) {
        throw new Error(`Tween from/to pair association error!`)
      } else {
        createTweenEntries(target[key], from && valueFrom, to && valueTo, entries)
      }
    } else {
      entries.push({ from: valueFrom, to: valueTo, key, target })
    }
  }
  return entries
}

type TweenInstanceAddArg = { target: any, from?: any, to?: any }
class TweenInstance extends AnimationInstance {
  entries: TweenEntry[] = []
  add(arg: TweenInstanceAddArg | TweenInstanceAddArg[]): this {
    const array = Array.isArray(arg) ? arg : [arg]
    for (const item of array) {
      createTweenEntries(
        item.target,
        expandObject(item.from),
        expandObject(item.to),
        this.entries,
      )
    }
    return this
  }
}

type TweenArg<T> = {
  target: T | T[]
} & Partial<typeof defaultTweenArg & {
  from: Record<string, any>
  to: Record<string, any>
}>

/**
 * Usage:
 * ```
 * Animation.tween({
 *   target: myVector,
 *   to: { x: 1 },
 *   duration: 1,
 *   ease: 'inOut3',
 * })
 */
function tween<T extends Record<string, any>>(arg: TweenArg<T>): TweenInstance {
  const {
    clear,
    duration,
    delay,
    timeScale,
    ease,
    autoDestroy,
    prerun,
    target,
    from,
    to,
  } = { ...defaultTweenArg, ...arg }
  const instance = registerInstance(clear, new TweenInstance(duration, delay, timeScale, target, autoDestroy, prerun))
  if (from ?? to) {
    instance.add({ target, from, to })
  }
  const easingFunction = typeof ease === 'function' ? ease : parseEase(ease)
  instance
    .onUpdate(({ progress }) => {
      const alpha = easingFunction(progress)
      const { entries } = instance
      for (let index = 0, length = entries.length; index < length; index++) {
        const { target, key, from, to } = entries[index]
        target[key] = from + (to - from) * alpha
      }
    })
  return instance
}

/**
 * Low-level animation utility.
 * 
 * Usage:
 * ```ts
 * Animation
 *   .during({ duration: 1, delay: .4, target: 'foo' })
 *   .onUpdate(({ progress }) => { })
 * 
 * Animation
 *   .during(1)
 *   .onUpdate(({ progress }) => {
 *   })
 * ```
 */
const AnimationModule = {
  // easing:
  remap,
  ease: parseEase,

  // animation:
  during,
  tween,
  existing,
  clear,
  safewords,

  core: {
    instancesCount: () => instances.length,
    instances: () => [...instances],
    updateInstances,
    startAnimationLoop,
    stopAnimationLoop,
  },
}

export type {
  Callback as AnimationCallback,
  TweenArg as AnimationTweenArg,
  TweenInstance as AnimationTweenInstance
}

export {
  AnimationModule as Animation,

  // re-export easing functions:
  parseEase,
  remap
}

// if (typeof window !== 'undefined') {
//   Object.assign(window, { Animation: AnimationBundle })
// }
