type Loader<T> = () => Promise<T>

/**
 * A utility class to manage asynchronous resources.
 * 
 * Notes:
 * - The resource is loaded lazily when `require()` is called for the first time.
 * - The resource is loaded only once, subsequent calls to `require()` will have no effect until `clear()` is called.
 * 
 * ### Usage:
 * ```
 * const resource = new AsyncResource(() => fetch('/data.json').then(res => res.json()))
 * 
 * // Start loading the resource:
 * resource.require()
 * 
 * // Probably null...
 * resource.get()
 * 
 * // Other part of the code can require the same resource:
 * const { foo, bar } = await resource.require()
 * 
 * // Or wait for the resource to be ready without triggering loading:
 * const { foo, bar } = await resource.ready()
 * ```
 * 
 * ### Example inside a class:
 * ```
 * class MyClass {
 *   static myResource = new AsyncResource(async () => gltfLoader.loadAsync('/model.gltf'))
 * 
 *   constructor() {
 *     MyClass.myResource.require().then(({ scene }) => {
 *        this.add(clone(scene))
 *     })
 *   }
 * }
 * ```
 */
export class AsyncResource<T> {
  #loader: Loader<T>

  #promise: Promise<T> | null = null
  #value: T | null = null
  #error: unknown = null
  #onResolveCallbacks: Array<(value: T) => void> = []
  #onRejectCallbacks: Array<(error: unknown) => void> = []

  constructor(loader: Loader<T>) {
    this.#loader = loader
  }

  isReady() {
    return this.#value !== null
  }

  get(): T | null {
    return this.#value
  }

  require(): Promise<T> {
    if (this.#value !== null) {
      return Promise.resolve(this.#value)
    }

    if (this.#promise === null) {
      this.#promise = this.#loader()
        .then((value) => {
          this.#value = value
          this.#error = null
          for (const callback of this.#onResolveCallbacks) {
            callback(value)
          }
          return value
        })
        .catch((error) => {
          this.#error = error
          this.#promise = null
          for (const callback of this.#onRejectCallbacks) {
            callback(error)
          }
          throw error
        })
    }

    return this.#promise
  }

  /**
   * Returns a promise that resolves when the resource is ready without triggering loading if it hasn't been triggered yet.
   * 
   * Notes:
   * - ⚠️ This methode will NOT trigger loading if it hasn't been triggered yet. 
   *   You must call `load()` first to start loading the resource.
   */
  async ready(): Promise<T> {
    if (this.#value !== null) {
      return this.#value
    }
    if (this.#promise === null) {
      return new Promise((resolve, reject) => {
        this.#onResolveCallbacks.push(resolve)
        this.#onRejectCallbacks.push(reject)
      })
    }
    return this.#promise
  }

  get error() {
    return this.#error
  }

  /**
   * Clears the loaded resource and resets the state, allowing it to be loaded again on the next `require()` call.
   */
  clear() {
    this.#promise = null
    this.#value = null
    this.#error = null
    this.#onResolveCallbacks = []
    this.#onRejectCallbacks = []
  }
}