export async function wait(seconds: number) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}



const defaultWaitSecondsOptions = {
  /**
   * The frequency at which the generator will yield.
   */
  frequency: 10,
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
  const interval = 1 / frequency
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
