
export type Promisified<T> = T & PromiseLike<T> & { resolve: () => T, reject: (reason?: any) => void }

const defaultOptions = {
  /**
   * If true, the promise will be resolved immediately.
   * @default false
   */
  resolved: false,
}

/**
 * Turns an object into a promise-like object. 
 * 
 * The following methods will be added:
 * 
 * The following methods will be added:
 * - then (promise-like implementation)
 * - catch (promise-like implementation)
 * - finally (promise-like implementation)
 * - resolve (controls the promise)
 * - reject (controls the promise)
 * 
 * Usage:
 * ```
 * const value = promisify({ x: 1 })
 * setTimeout(() => {
 *   value.x = 2
 *   value.resolve()
 * }, 1000)
 * console.log(value.x) // 1
 * await value
 * console.log(value.x) // 2
 * ```
 */
export function promisify<T extends object>(value: T, options?: typeof defaultOptions): Promisified<T> {
  let { resolved = false } = { ...defaultOptions, ...options }
  const memo = {
    resolve: () => value,
    reject: (reason?: any) => { },
  }
  const promise = new Promise<T>((_resolve, _reject) => {
    memo.resolve = () => {
      done()
      _resolve(value)
      return value
    }
    memo.reject = (reason: any) => {
      done()
      _reject(new Error(reason))
    }
  })
  const done = () => {
    delete (memo as any).resolve
    delete (memo as any).reject
    delete (value as any).then
    delete (value as any).catch
    delete (value as any).finally
    delete (value as any).resolve
    delete (value as any).reject
  }
  const thenFn = (onFulfilled?: (value: T) => any, onRejected?: (reason: any) => any) => {
    if (resolved) {
      memo.resolve()
      resolved = false
    }
    return promise.then(onFulfilled, onRejected)
  }
  const catchFn = (onRejected?: (reason: any) => any) => {
    return promise.catch(onRejected)
  }
  const finallyFn = (onFinally?: () => void) => {
    return promise.finally(onFinally)
  }
  Object.assign(value, {
    then: thenFn,
    catch: catchFn,
    finally: finallyFn,
    resolve: () => memo.resolve(),
    reject: () => memo.reject(),
  })
  return value as any
}