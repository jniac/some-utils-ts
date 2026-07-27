export type PoolOverflowStrategy = 'oldest' | 'random'

const releasePoolBinding = Symbol('releasePoolBinding')
const updatePoolBinding = Symbol('updatePoolBinding')

export interface PoolOptions<T> {
  initialSize?: number
  maxCapacity: number
  overflowStrategy?: PoolOverflowStrategy

  /**
   * Creates a new physical instance.
   */
  create(): T

  /**
   * Called when an instance becomes active.
   */
  onAcquire?(item: T, binding: PoolBinding<T>): void

  /**
   * Called when an instance stops being active, regardless of the reason.
   */
  onRelease?(
    item: T,
    binding: PoolBinding<T>,
    reason: PoolReleaseReason,
  ): void

  /**
   * Called on each update tick while the instance is active.
   */
  onUpdate?(item: T, binding: PoolBinding<T>, deltaTime: number): void

  /**
   * Permanently cleans up the physical instance.
   */
  destroy?(item: T): void

  /**
   * Clock expressed in seconds.
   *
   * Defaults to performance.now() / 1000.
   */
  now?: () => number

  /**
   * Random number generator used by the "random" strategy.
   *
   * Defaults to Math.random.
   */
  random?: () => number
}

export type PoolReleaseReason =
  | 'manual'
  | 'expired'
  | 'overflow'
  | 'clear'
  | 'destroy'

export class PoolBinding<T> {
  readonly value: T
  readonly acquireTime: number
  readonly lifetime: number | undefined

  #releaseTime: number | undefined
  #releaseReason: PoolReleaseReason | undefined
  #time = 0

  constructor(
    value: T,
    acquireTime: number,
    lifetime: number | undefined,
  ) {
    this.value = value
    this.acquireTime = acquireTime
    this.lifetime = lifetime
  }

  get expirationTime(): number | undefined {
    if (this.lifetime === undefined) {
      return undefined
    }

    return this.acquireTime + this.lifetime
  }

  get releaseTime(): number | undefined {
    return this.#releaseTime
  }

  get releaseReason(): PoolReleaseReason | undefined {
    return this.#releaseReason
  }

  get isActive(): boolean {
    return this.#releaseTime === undefined
  }

  get time(): number {
    return this.#time
  }

  get progress(): number {
    if (this.lifetime === undefined || this.lifetime === Infinity) {
      return 0
    }

    return Math.min(1, this.#time / this.lifetime)
  }

  getRemainingLifetime(now?: number): number | undefined {
    if (now === undefined) {
      if (this.lifetime === undefined) {
        return undefined
      }

      return Math.max(0, this.lifetime - this.#time)
    }

    const expirationTime = this.expirationTime

    if (expirationTime === undefined) {
      return undefined
    }

    return Math.max(0, expirationTime - now)
  }

  isExpired(now?: number): boolean {
    if (now === undefined) {
      return (
        this.lifetime !== undefined &&
        this.#time >= this.lifetime
      )
    }

    const expirationTime = this.expirationTime

    return (
      expirationTime !== undefined &&
      now >= expirationTime
    )
  }

  [releasePoolBinding](
    releaseTime: number,
    reason: PoolReleaseReason,
  ): void {
    if (!this.isActive) {
      throw new Error('PoolBinding has already been released.')
    }

    this.#releaseTime = releaseTime
    this.#releaseReason = reason
  }

  [updatePoolBinding](deltaTime: number): void {
    this.#time += deltaTime
  }
}

export class Pool<T> {
  readonly free = new Set<T>()

  readonly #activeBindings = new Map<T, PoolBinding<T>>()
  readonly #all = new Set<T>()

  readonly #maxCapacity: number
  readonly #overflowStrategy: PoolOverflowStrategy
  readonly #now: () => number
  readonly #random: () => number
  readonly #options: PoolOptions<T>

  constructor(options: PoolOptions<T>) {
    this.#options = options
    const initialSize = options.initialSize ?? 0

    if (!Number.isInteger(initialSize) || initialSize < 0) {
      throw new RangeError(
        'initialSize must be a positive integer or zero.',
      )
    }

    if (
      !Number.isInteger(options.maxCapacity) ||
      options.maxCapacity <= 0
    ) {
      throw new RangeError(
        'maxCapacity must be a strictly positive integer.',
      )
    }

    if (initialSize > options.maxCapacity) {
      throw new RangeError(
        'initialSize cannot exceed maxCapacity.',
      )
    }

    this.#maxCapacity = options.maxCapacity
    this.#overflowStrategy =
      options.overflowStrategy ?? 'oldest'

    this.#now =
      options.now ??
      (() => performance.now() / 1000)

    this.#random = options.random ?? Math.random

    for (let i = 0; i < initialSize; i++) {
      const item = this.#createItem()
      this.free.add(item)
    }
  }

  activeBindings(): Iterable<PoolBinding<T>> {
    return this.#activeBindings.values()
  }

  /**
   * Acquires an item.
   *
   * @param lifetime Lifetime in seconds.
   *                 undefined means an unlimited lifetime.
   */
  acquire({
    lifetime = Infinity,
  }: {
    lifetime?: number
  } = {}): PoolBinding<T> {
    this.#validateLifetime(lifetime)

    const now = this.#now()

    let item = this.#takeFreeItem()

    if (item === undefined && this.#all.size < this.#maxCapacity) {
      item = this.#createItem()
    }

    if (item === undefined) {
      const victim = this.#selectOverflowVictim()

      if (victim === undefined) {
        throw new Error(
          'Pool is saturated but no active item can be recycled.',
        )
      }

      item = victim.value
      this.#releaseBinding(victim, 'overflow', now)

      // #releaseBinding() has just put the item back into free.
      this.free.delete(item)
    }

    const binding = new PoolBinding(
      item,
      now,
      lifetime,
    )

    this.#activeBindings.set(item, binding)
    this.#options.onAcquire?.(item, binding)

    return binding
  }

  /**
   * Manually releases a binding.
   *
   * Returns false if the binding is no longer active or does not belong to
   * this pool.
   */
  release(binding: PoolBinding<T>): boolean {
    const currentBinding =
      this.#activeBindings.get(binding.value)

    if (currentBinding !== binding) {
      return false
    }

    this.#releaseBinding(
      binding,
      'manual',
      this.#now(),
    )

    return true
  }

  /**
   * Advances and updates active bindings.
   *
   * @param deltaTime Elapsed time in seconds since the previous update.
   * Returns the number of expired items.
   */
  update(deltaTime: number): number {
    this.#validateDeltaTime(deltaTime)

    let releasedCount = 0
    const now = this.#now()

    // Copy the values so the Map can be mutated safely during iteration.
    const bindings = [...this.#activeBindings.values()]

    for (const binding of bindings) {
      binding[updatePoolBinding](deltaTime)

      if (!binding.isExpired()) {
        this.#options.onUpdate?.(
          binding.value,
          binding,
          deltaTime,
        )
        continue
      }

      this.#releaseBinding(
        binding,
        'expired',
        now,
      )

      releasedCount++
    }

    return releasedCount
  }

  /**
   * Permanently destroys a free item.
   *
   * An active item must be released first.
   */
  destroyItem(item: T): boolean {
    if (this.#activeBindings.has(item)) {
      throw new Error(
        'Cannot destroy an active pool item. Release it first.',
      )
    }

    if (!this.#all.delete(item)) {
      return false
    }

    this.free.delete(item)
    this.#options.destroy?.(item)

    return true
  }

  /**
   * Releases all active bindings while retaining the physical instances.
   */
  releaseAll(): void {
    const now = this.#now()
    const bindings = [...this.#activeBindings.values()]

    for (const binding of bindings) {
      this.#releaseBinding(
        binding,
        'clear',
        now,
      )
    }
  }

  /**
   * Destroys all physical instances in the pool.
   */
  dispose(): void {
    const now = this.#now()
    const bindings = [...this.#activeBindings.values()]

    for (const binding of bindings) {
      this.#releaseBinding(
        binding,
        'destroy',
        now,
        false,
      )
    }

    for (const item of this.#all) {
      this.#options.destroy?.(item)
    }

    this.free.clear()
    this.#activeBindings.clear()
    this.#all.clear()
  }

  has(item: T): boolean {
    return this.#all.has(item)
  }

  isActive(item: T): boolean {
    return this.#activeBindings.has(item)
  }

  getBinding(item: T): PoolBinding<T> | undefined {
    return this.#activeBindings.get(item)
  }

  get size(): number {
    return this.#all.size
  }

  get freeCount(): number {
    return this.free.size
  }

  get activeCount(): number {
    return this.#activeBindings.size
  }

  get capacity(): number {
    return this.#maxCapacity
  }

  get isSaturated(): boolean {
    return (
      this.#all.size >= this.#maxCapacity &&
      this.free.size === 0
    )
  }

  #createItem(): T {
    const item = this.#options.create()

    if (
      this.#all.has(item) ||
      this.#activeBindings.has(item) ||
      this.free.has(item)
    ) {
      throw new Error(
        'Pool create() returned an item that already belongs to the pool.',
      )
    }

    this.#all.add(item)

    return item
  }

  #takeFreeItem(): T | undefined {
    const iterator = this.free.values()
    const item = iterator.next().value as T | undefined

    if (item !== undefined) {
      this.free.delete(item)
    }

    return item
  }

  #releaseBinding(
    binding: PoolBinding<T>,
    reason: PoolReleaseReason,
    now: number,
    returnToFree = true,
  ): void {
    const currentBinding =
      this.#activeBindings.get(binding.value)

    if (currentBinding !== binding) {
      throw new Error(
        'PoolBinding is inactive or belongs to another acquisition.',
      )
    }

    this.#activeBindings.delete(binding.value)
    binding[releasePoolBinding](now, reason)

    this.#options.onRelease?.(
      binding.value,
      binding,
      reason,
    )

    if (returnToFree) {
      this.free.add(binding.value)
    }
  }

  #selectOverflowVictim(): PoolBinding<T> | undefined {
    switch (this.#overflowStrategy) {
      case 'oldest':
        return this.#selectOldestBinding()

      case 'random':
        return this.#selectRandomBinding()

      default:
        return assertNever(this.#overflowStrategy)
    }
  }

  #selectOldestBinding(): PoolBinding<T> | undefined {
    let oldest: PoolBinding<T> | undefined

    for (const binding of this.#activeBindings.values()) {
      if (
        oldest === undefined ||
        binding.acquireTime < oldest.acquireTime
      ) {
        oldest = binding
      }
    }

    return oldest
  }

  #selectRandomBinding(): PoolBinding<T> | undefined {
    const count = this.#activeBindings.size

    if (count === 0) {
      return undefined
    }

    const targetIndex = Math.min(
      count - 1,
      Math.floor(this.#random() * count),
    )

    let index = 0

    for (const binding of this.#activeBindings.values()) {
      if (index === targetIndex) {
        return binding
      }

      index++
    }

    return undefined
  }

  #validateLifetime(
    lifetime: number | undefined,
  ): void {
    if (lifetime === undefined || lifetime === Infinity) {
      return
    }

    if (!Number.isFinite(lifetime) || lifetime < 0) {
      throw new RangeError(
        'lifetime must be a finite positive number or zero, expressed in seconds.',
      )
    }
  }

  #validateDeltaTime(deltaTime: number): void {
    if (!Number.isFinite(deltaTime) || deltaTime < 0) {
      throw new RangeError(
        'deltaTime must be a finite positive number or zero, expressed in seconds.',
      )
    }
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`)
}
