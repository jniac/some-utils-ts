export type WatcherOptions<T> = {
  /**
   * A function that takes the watched object and returns a primitive value to be compared for changes.
   */
  reduce: (obj: T) => number | string | boolean | null,
  /**
   * The callback to run when the reduced value changes (or when the watcher is first created).
   */
  effect: (obj: T, watcher: Watcher<T>) => void,
  /**
   * If specified, the watcher will only check for changes at most once per this many milliseconds. The reduced value is cached and only updated at those times.
   */
  debounce?: number,
  /**
   * If true, the effect will run immediately when the watcher is created, otherwise it will only run when the value changes from the initial value.
   */
  immediate?: boolean,
}

export class Watcher<T> {
  currentTime = -1
  currentReducedValue: number | string | boolean | null = null

  constructor(
    public value: T,
    public options: WatcherOptions<T>,
  ) {
    if (options.immediate)
      this.check()
  }

  check() {
    const newTime = this.options.debounce
      ? Math.floor(Date.now() / this.options.debounce) * this.options.debounce
      : Date.now()

    if (newTime === this.currentTime)
      return

    this.currentTime = newTime

    const newReducedValue = this.options.reduce(this.value)
    if (newReducedValue !== this.currentReducedValue) {
      this.currentReducedValue = newReducedValue
      this.options.effect(this.value, this)
    }
  }

  update(newValue: T) {
    this.value = newValue
    this.check()
  }
}

export function watch<T>(obj: T, options: WatcherOptions<T>) {
  const watcher = new Watcher(obj, options)
  return watcher
}
