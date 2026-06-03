
export async function wait(delay: number | 'nextFrame' | `${number}s` | `${number}ms` = 0): Promise<void> {
  if (delay === 'nextFrame') {
    return waitNextFrame()
  }
  if (typeof delay === 'string') {
    const match = delay.match(/^(\d+)(ms|s)$/)
    if (match) {
      const value = parseInt(match[1], 10)
      const unit = match[2]
      if (unit === 's') {
        delay = value * 1000
      } else {
        delay = value
      }
    } else {
      throw new Error(`Invalid delay format: ${delay}`)
    }
  }
  return new Promise(resolve => window.setTimeout(resolve, delay))
}

export async function waitNextFrame(): Promise<void> {
  return new Promise(resolve => window.requestAnimationFrame(() => resolve()))
}

const defaultWaitSecondsOptions = {
  /**
   * The frequency at which the generator will yield.
   * 
   * If 'max', it will yield every frame.
   * 
   * @default 'max'
   */
  frequency: <number | 'max'>'max',
}

/**
 * The name may sound familiar.
 * 
 * This generator behaves much like the Unity one.
 * 
 * Usage:
 * ```
 * async function someAsyncFunction() {
 *   for await (const tick of waitForSeconds(3)) {
 *     console.log(tick.progress)
 *   }
 * }
 * ```
 */
export async function* waitForSeconds(seconds: number, options?: Partial<typeof defaultWaitSecondsOptions>) {
  const { frequency } = { ...defaultWaitSecondsOptions, ...options }
  const interval = frequency === 'max' ? 0 : 1 / frequency
  const start = Date.now()
  let progress = 0
  let elapsed = 0
  let tick = 0
  const it = {
    get tick() { return tick },
    get progress() { return progress },
    get elapsed() { return elapsed },
  }
  while (progress < 1) {
    await wait(interval)
    elapsed = (Date.now() - start) / 1000
    progress = Math.min(elapsed / seconds, 1)
    tick++
    yield it
  }
}
