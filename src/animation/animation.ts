import { MultiKeyWeakMap } from '../collection/multi-key-map'
import { clamp, clamp01 } from '../math/basic'
import { isObject } from '../object/common'
import { expandObject } from '../object/expand'
import { EasingDeclaration, easing } from './easing'

type Callback = (animation: AnimationInstance) => void

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

const instanceWeakMap = new MultiKeyWeakMap<any, AnimationInstance>()

let animationInstanceCounter = 0
class AnimationInstance {
  readonly id = animationInstanceCounter++

  readonly duration: number
  readonly delay: number
  readonly target: any
  unclampedTime: number
  unclampedTimeOld: number
  frame: number
  timeScale: number

  // Computed user destinated values.
  time: number = 0
  timeOld: number = 0
  progress: number = 0

  // Accessors:
  get complete() { return this.progress === 1 }
  get delayed() { return this.unclampedTime < 0 }
  get deltaTime() { return this.time - this.timeOld }

  constructor(duration: number, delay: number, timeScale: number, target: any) {
    this.duration = duration
    this.delay = delay
    this.frame = 0
    this.timeScale = timeScale
    this.unclampedTimeOld =
      this.unclampedTime = -delay
    this.target = target
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
  progressLerp = (from: number, to: number, ease: EasingDeclaration = 'linear') => {
    const alpha = easing(ease)(this.progress)
    return from + (to - from) * alpha
  }
}

let instances: AnimationInstance[] = []

const destroyInstance = (instance: AnimationInstance) => {
  for (const callback of onDestroy.get(instance.id)) {
    callback(instance)
  }
  onUpdate.clear(instance.id)
  onDestroy.clear(instance.id)
}

const registerInstance = <T extends AnimationInstance>(instance: T): T => {
  const { target } = instance
  if (target !== undefined) {
    const existingInstance = instanceWeakMap.get(target)
    if (existingInstance) {
      destroyInstance(existingInstance)
    }
    instanceWeakMap.set(target, instance)
  }
  instances.push(instance)
  return instance
}

const updateInstances = (deltaTime: number) => {
  for (let i = 0, max = instances.length; i < max; i++) {
    const instance = instances[i]

    instance.frame++

    instance.unclampedTimeOld = instance.unclampedTime
    instance.unclampedTime += deltaTime * instance.timeScale

    instance.timeOld = instance.time
    instance.time = clamp(instance.unclampedTime, 0, instance.duration)

    instance.progress = Number.isFinite(instance.duration)
      ? clamp01(instance.time / instance.duration)
      : 0 // progress is zero on infinite animation.

    if (instance.unclampedTime > 0 || instance.frame === 1) {
      for (const callback of onUpdate.get(instance.id)) {
        callback(instance)
      }
    }
  }

  const instancesToBeDestroyed = new Set<AnimationInstance>()
  instances = instances.filter(instance => {
    if (instance.progress === 1) {
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
function startAnimationLoop() {
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

// --------------[ Clear ]--------------- //

function clear(target: any) {
  const instance = instanceWeakMap.get(target)
  if (instance) {
    destroyInstance(instance)
  }
}


// --------------[ During ]--------------- //

type DuringArg = {
  /**
   * Duration in seconds.
   */
  duration: number
  /**
   * Delay in seconds.
   */
  delay?: number
  /**
   * Time scale.
   */
  timeScale?: number
  /**
   * Target, if an instance is associated with a target, it will be destroyed 
   * when a new instance is created for the same target.
   */
  target?: any
}

function during(arg: DuringArg): AnimationInstance
/**
 * 
 * @param duration duration in seconds
 */
function during(duration: number): AnimationInstance
function during(arg: any) {
  const [duration, delay, timeScale, target] = (typeof arg === 'number'
    ? [arg, 0, 1, undefined]
    : [arg.duration, arg.delay ?? 0, arg.timeScale ?? 1, arg.target]
  ) as [number, number, number, any]
  return registerInstance(new AnimationInstance(duration, delay, timeScale, target))
}



// --------------[ Tween ]--------------- //

const defaultTweenArg = {
  duration: 1,
  delay: 0,
  timeScale: 1,
  ease: <EasingDeclaration>'inOut2',
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

function tween<T extends Record<string, any>>(arg: TweenArg<T>): TweenInstance {
  const {
    duration,
    delay,
    timeScale,
    ease,
    target,
    from,
    to,
  } = { ...defaultTweenArg, ...arg }
  const instance = registerInstance(new TweenInstance(duration, timeScale, delay, target))
  if (from ?? to) {
    instance.add({ target, from, to })
  }
  const easingFunction = easing(ease)
  instance.onUpdate(({ progress }) => {
    const alpha = easingFunction(progress)
    const { entries } = instance
    for (let index = 0, length = entries.length; index < length; index++) {
      const { target, key, from, to } = entries[index]
      target[key] = from + (to - from) * alpha
    }
  })
  return instance
}

type Bundle = {
  during: typeof during
  easing: typeof easing
  tween: typeof tween
  clear: typeof clear
  core: {
    updateInstances: typeof updateInstances
    startAnimationLoop: typeof startAnimationLoop
    stopAnimationLoop: typeof stopAnimationLoop
  }
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
const AnimationBundle: Bundle = {
  during,
  easing,
  tween,
  clear,
  core: {
    updateInstances,
    startAnimationLoop,
    stopAnimationLoop,
  },
}

export type {
  Callback as AnimationCallback,
  TweenArg as AnimationTweenArg
}

export {
  AnimationBundle as Animation
}

// if (typeof window !== 'undefined') {
//   Object.assign(window, { Animation: AnimationBundle })
// }
