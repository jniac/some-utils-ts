import { DestroyableObject, OneOrMany, StringMatcher } from '../types'
import { HashRegister } from './hash-register'

type Callback<Payload = any> = {
  (message: Message<Payload>): void
}

class Listener {
  target: any
  filter: StringMatcher
  callback: Callback
  match: (target: any, type: string) => boolean
  constructor(target: any, filter: StringMatcher, callback: Callback) {
    this.filter = filter
    this.target = target
    this.callback = callback
    const matchTarget =
      (incomingTarget: any) => HashRegister.areSame(incomingTarget, this.target)
    const matchType = (
      filter === '*' ? () => true :
        typeof filter === 'string' ? (type: string) => type === filter :
          filter instanceof RegExp ? (type: string) => filter.test(type) :
            () => false)
    this.match = (target: any, type: string) => matchTarget(target) && matchType(type)
  }
}

const hashRegister = new HashRegister()
const listenerMap = new Map<number, Listener[]>()

function requireListeners(id: number): Listener[] {
  return listenerMap.get(id) ?? (() => {
    const listeners: Listener[] = []
    listenerMap.set(id, listeners)
    return listeners
  })()
}

function removeListener(id: number, listener: Listener): boolean {
  const listeners = listenerMap.get(id)
  if (listeners) {
    const index = listeners.indexOf(listener)
    if (index !== -1) {
      listeners.splice(index, 1)
      if (listeners.length === 0) {
        listenerMap.delete(id)
      }
      return true
    }
  }
  return false
}

/**
 * Message system for intra-application communication.
 *
 * ## How to use it?
 * 
 * ### 1. The easy way:
 * 
 * Send a message:
 * ```
 * Message.send(myTarget, { payload: 'hello' })
 * ```
 * Subscribe to a message:
 * ```
 * Message.on<string>(myTarget, message => {
 *   console.log(message.payload) // "hello" from the previous message
 * })
 * ```
 * 
 * ### 2. With a "type":
 * ```
 * Message.on<string>(myTarget, 'HELLO', message => {
 *   console.log(message.type, message.payload)
 * })
 * Message.send(myTarget, 'HELLO', { payload: 'world' })
 * ```
 * Note that `type` on listener can also be a string matcher (RegExp or `*`), one or many:
 * ```
 * Message.on<string>(myTarget, /HELL/, message => { ... })
 * Message.on<string>(myTarget, '*', message => { ... })
 * Message.on<string>(myTarget, ['HELLO', 'HI'], message => { ... })
 * ```
 * 
 * ### 3. Ok, but what is "myTarget" here?
 * # Absolutely everything!
 * It could be:
 * - a primitive (1, "FOO", Symbol() etc.)
 * - a object
 * - any combination of the two (via an array, order-sensitive, but nesting ignored (eg: [a, [b, c]] === [a, b, c]))
 * ```
 * const secretKey = Symbol('secret')
 * 
 * type UserAuth = {
 *   ok: boolean
 *   info: string
 * }
 * 
 * Message.on<UserAuth>([window, 'USER_AUTH', secretKey], m => {
 *   const { ok, info } = m.payload!
 *   if (ok) {
 *     proceed()
 *   } else {
 *     console.log(info)
 *   }
 * })
 * 
 * Message.send<UserAuth>([window, 'USER_AUTH', secretKey], {
 *   payload: { ok: true, info: 'The user has logged in.' },
 * })
 * 
 * Message.send<UserAuth>([window, 'USER_AUTH', secretKey], {
 *   payload: { ok: false, info: 'The user failed to log in.' },
 * })
 * ```
 */
class Message<Payload = any, Response = any> {
  static solveOnArgs<Payload = any>(args: any[]): [target: any, filter: StringMatcher[], callback: Callback<Payload>] {
    if (args.length === 2) {
      const [target, callback] = args
      return [target, ['*'], callback]
    }
    const [target, filterArg, callback] = args
    const filters: StringMatcher[] = Array.isArray(filterArg) ? filterArg : [filterArg]
    return [target, filters, callback]
  }
  /**
   * Add a callback to a target.
   * ```
   * Message.on<{ ok: boolean }>('USER', m => {
   *   const { ok } = m.payload!
   * })
   * ```
   * A "string filter" can be specified: 
   * ```
   * Message.on<{ ok: boolean }>('USER', /AUTH/, m => {
   *   const { ok } = m.payload!
   * })
   * ```
   */
  static on<Payload = any>(target: any, callback: (message: Message<Payload>) => void): DestroyableObject
  static on<Payload = any>(target: any, filter: OneOrMany<StringMatcher>, callback: (message: Message<Payload>) => void): DestroyableObject
  static on<Payload = any>(...args: any): DestroyableObject {
    const [target, filters, callback] = Message.solveOnArgs<Payload>(args)
    const targetId = hashRegister.requireHash(target)
    const listeners = filters.map(filter => new Listener(target, filter, callback))
    requireListeners(targetId).push(...listeners)
    const destroy = () => {
      for (const listener of listeners)
        removeListener(targetId, listener)
    }
    return { destroy }
  }

  /**
   * Add a callback to a target that will be called only once. Useful for waiting
   * a single occurrence in question/response scenarios.
   * ```
   * Message.once('USER:RESPONSE', m => {
   *   // Do something smart here.
   * })
   * Message.send('USER:REQUEST', { payload: { ... } })
   * ```
   */
  static once<Payload = any>(target: any, callback: (message: Message<Payload>) => void): DestroyableObject
  static once<Payload = any>(target: any, filter: OneOrMany<StringMatcher>, callback: (message: Message<Payload>) => void): DestroyableObject
  static once<Payload = any>(...args: any): DestroyableObject {
    const [target, filters, callback] = Message.solveOnArgs<Payload>(args)
    const wrapperCallback: Callback<Payload> = (message) => {
      destroy()
      callback(message)
    }
    const destroy = Message.on(target, filters, wrapperCallback).destroy
    return { destroy }
  }

  /**
   * Wait for a message to be sent, returns a promise that resolves when the message is sent.
   */
  static wait<Payload = any>(target: any): Promise<Message<Payload>>
  static wait<Payload = any>(target: any, filter: StringMatcher): Promise<Message<Payload>>
  static wait<Payload = any>(...args: any): Promise<Message<Payload>> {
    return new Promise(resolve => {
      const callback = (message: Message<Payload>) => {
        resolve(message)
      }
      const [target, filters] = Message.solveOnArgs<Payload>([...args, callback])
      Message.on(target, filters, callback)
    })
  }

  static solveSendArgs<Payload = any>(args: any[]): [target: any, type?: string, payload?: Payload] {
    const [target, ...rest] = args
    if (rest.length === 2) {
      const [type, { payload }] = rest
      return [target, type, payload]
    }
    if (rest.length === 1) {
      const [arg2] = rest
      return typeof arg2 === 'string' ? [target, arg2] : [target, undefined, arg2.payload]
    }
    return [target]
  }

  /**
   * Send a message.
   */
  static send<Payload = any>(target: any): Message<Payload>
  static send<Payload = any>(target: any, type: string): Message<Payload>
  static send<Payload = any>(target: any, options: { payload: Payload }): Message<Payload>
  static send<Payload = any>(target: any, type: string, options: { payload: Payload }): Message<Payload>
  static send<Payload = any>(...args: any[]): Message<Payload> {
    const [target, type, payload] = Message.solveSendArgs<Payload>(args)
    return new Message(target, type, payload)
  }

  /**
   * Send a message to both the target and the type.
   * 
   * When listening, you can listen to either the target (local) or the type (global).
   * 
   * ```ts
   * Message.sendDual(myTarget, 'SOME_TYPE')
   * 
   * // Somewhere else:
   * 
   * // global (on the type):
   * Message.on('SOME_TYPE', message => {
   *   const { target } = message.assertPayload()
   *   console.log('(global) React to', message.target, target)
   * })
   *
   * // local (on the target):
   * Message.on(myTarget, 'SOME_TYPE', message => {
   *   console.log('(local) React to', message.type, message.target)
   * })
   * ```
   */
  static sendDual(target: any, type: string, extraPayload: Omit<Record<string, any>, 'target'> = {}) {
    const payload = { target, ...extraPayload }
    Message.send(type, { payload })
    Message.send(target, type, { payload })
  }

  /**
   * Message allows to require, wait for, and dispatch any value via 
   * the message system. This can be useful for decoupling and avoiding global 
   * references to singleton instances.
   * 
   * This is the symbol associated with the instance to allow a unique channel.
   */
  static #exposeSymbol = Symbol('Message.exposeSymbol')

  static #exposeDestroyWeakMap = new WeakMap<any, () => void>()

  static #exposeDestroyMap = new Map<string | number | symbol | null | undefined, () => void>()

  static #getExistingDestroy(key: any): (() => void) | undefined {
    if (typeof key === 'object' && key !== null) {
      return this.#exposeDestroyWeakMap.get(key)
    } else {
      return this.#exposeDestroyMap.get(key)
    }
  }

  static #setExistingDestroy(key: any, destroy: () => void): void {
    if (typeof key === 'object' && key !== null) {
      this.#exposeDestroyWeakMap.set(key, destroy)
    } else {
      this.#exposeDestroyMap.set(key, destroy)
    }
  }

  /**
   * Works with `Message.require` and `Message.waitFor` to provide a value for a given key.
   * 
   * ### Usage
   * ```ts
   * Message.expose('MY_KEY', { foo: 'bar' })
   * // Somewhere else:
   * const { foo } = Message.require('MY_KEY')
   * // or:
   * const { foo } = await Message.waitFor('MY_KEY')
   * ```
   */
  static expose<T>(key: any, value: T): DestroyableObject {
    // #1 Send a message with the instance as payload, so that any current listeners waiting for it can receive it.
    Message.send<T>([Message.#exposeSymbol, key], { payload: value })

    // #2 Set up a listener for future `requireInstance` calls, so that they can receive the instance as well. If there was a previous instance registered, its listener is destroyed to avoid memory leaks and unintended behavior.
    this.#getExistingDestroy(key)?.()
    const { destroy } = Message.on<T>([Message.#exposeSymbol, key], message => {
      message.setPayload(value)
    })
    Message.#setExistingDestroy(key, destroy)
    return { destroy }
  }

  /**
   * Request a value for a given key. If the value is not found, null is returned.
   * 
   * ### Usage
   * ```ts
   * const value = Message.request('MY_KEY')
   * if (value) {
   *   // use value
   * }
   * // or with a callback:
   * Message.request('MY_KEY', value => {
   *   // use value
   * })
   * ```
   */
  static request<T>(key: any, callback?: (value: T) => void): T | null {
    const message = Message.send<T>([Message.#exposeSymbol, key])
    const { payload } = message
    const value = payload ?? null
    if (value === null)
      return null
    callback?.(value)
    return value
  }

  /**
   * Same as `Message.request`, but throws an error if the value is not found. 
   */
  static require<T>(key: any, errorMessage?: string): T {
    const value = Message.request<T>(key)
    if (value === null) {
      throw new Error(`Message.require: could not find value for key "${key}"${errorMessage ? `: ${errorMessage}` : ''}`)
    }
    return value
  }

  static waitFor<T>(key: any): Promise<T> {
    return new Promise(resolve => {
      const value = Message.request<T>(key)
      if (value !== null) {
        resolve(value)
        return
      }
      const callback = (message: Message<T>) => {
        resolve(message.payload!)
      }
      Message.once<T>([Message.#exposeSymbol, key], callback)
    })
  }

  /**
   * Require an instance of a class via the message system. If no instance is found, 
   * null is returned.
   * 
   * ## Example
   * ```
   * const myValue = Message.require(MyClass)
   * if (myValue) {
   *   // use myValue
   * }
   * // or with a callback:
   * Message.require(MyClass, instance => {
   *   // use instance
   * })
   * ```
   * 
   * ## Why?
   * Why use this?
   * - ⛓️‍💥 Decoupling: The required class does not have to store a global reference to 
   *   its singleton instance. Someone else (a global manager) can provide it via 
   *   the message system.
   * - 🧐 Now it's the requiring code's responsibility to ensure the instance exists 
   *   or handle the null case, making the dependency explicit.
   * - ✅ Nice invariant syntax: `const myValue = Message.require(someKey)` 
   *   is concise, clear, and type-safe.
   * 
   * ## Multiple instances
   * If multiples instances should be provided for the same class, a "key" can be 
   * specified to differentiate them:
   * ```
   * const foo = Message.require([MyClass, 'foo'])
   * const bar = Message.require([MyClass, 'bar'])
   * ```
   */
  static requestInstance<T>(arg: [classArg: (new (...args: any) => T), key: string], callback?: (instance: T) => void): T | null
  static requestInstance<T>(classArg: (new (...args: any) => T), callback?: (instance: T) => void): T | null
  static requestInstance<T>(arg: any, callback?: (instance: T | null) => void): T | null {
    const message = Message.send<T>([Message.#exposeSymbol, arg])
    const { payload } = message
    const instance = payload ?? null
    if (instance === null)
      return null
    callback?.(instance)
    return instance
  }

  /**
   * Require an instance of a class via the message system. If no instance is found, an error is thrown.
   * 
   * Why use this?
   * - ⛓️‍💥 Decoupling: The required class does not have to store a global reference to 
   *   its singleton instance. Someone else (a global manager) can provide it via 
   *   the message system.
   * - 🧐 Now it's the requiring code's responsibility to ensure the instance exists 
   *   or handle the null case, making the dependency explicit.
   * - ✅ Nice invariant syntax: `const myValue = Message.requireInstanceOrThrow(MyClass)` 
   *   is concise and clear.
   */
  static requireInstance<T>(classArg: (new (...args: any) => T), errorMessage?: string): T {
    const instance = Message.requestInstance<T>(classArg)
    if (instance === null) {
      throw new Error(`Message.requireInstance: could not find instance for ${classArg.name}${errorMessage ? `: ${errorMessage}` : ''}`)
    }
    return instance
  }

  static #dispatchInstanceDestroy = new WeakMap<any, () => void>()
  /**
   * Set the instance to be returned for a class when using `requireInstance` or `requireInstanceOrThrow`.
   * 
   * Notes:
   * - This method will overwrite any previously set instance for the same class.
   */
  static exposeInstance<T>(classArg: (new (...args: any) => T), instance: T): DestroyableObject {
    // #1 Send a message with the instance as payload, so that any current listeners waiting for it can receive it.
    Message.send<T>([Message.#exposeSymbol, classArg], { payload: instance })

    // #2 Set up a listener for future `requireInstance` calls, so that they can receive the instance as well. If there was a previous instance registered, its listener is destroyed to avoid memory leaks and unintended behavior.
    this.#dispatchInstanceDestroy.get(classArg)?.()
    const { destroy } = Message.on<T>([Message.#exposeSymbol, classArg], message => {
      message.setPayload(instance)
    })
    Message.#dispatchInstanceDestroy.set(classArg, destroy)
    return { destroy }
  }

  /**
   * @deprecated Use `requireInstance` instead.
   */
  static requireInstanceOrThrow = Message.requireInstance

  /**
   * @deprecated Use `exposeInstance` instead.
   */
  static onRequireInstance = Message.exposeInstance

  /**
   * @deprecated Use `exposeInstance` instead.
   */
  static dispatchInstance = Message.exposeInstance

  /**
   * Return a promise that resolves with the instance of a class when it is dispatched via `dispatchInstance`. 
   * 
   * Notes:
   * - If the instance has already been dispatched, the promise will resolve immediately.
   */
  static waitForInstance<T>(classArg: (new (...args: any) => T)): Promise<T> {
    return new Promise(resolve => {
      const instance = Message.requestInstance<T>(classArg)

      // Immediate resolution:
      if (instance !== null) {
        resolve(instance)
        return
      }

      // Wait for future dispatch:
      else {
        const callback = (message: Message<T>) => {
          resolve(message.payload!)
        }
        Message.once<T>([Message.#exposeSymbol, classArg], callback)
      }
    })
  }

  /**
   * @deprecated For debugging purposes only.
   */
  static debug = {
    hashRegister,
    listenerForTarget: (target: any) => {
      const targetHash = hashRegister.requireHash(target)
      return (listenerMap.get(targetHash) ?? [])
        .filter(listener => listener.match(target, '*'))
    }
  }

  static #nextId = 0

  readonly id = Message.#nextId++
  readonly targetHash: number

  target: any
  type: string
  payload?: Payload
  response?: Response

  debug = { currentListenerIndex: -1, listenerCount: 0 }

  constructor(target: any, type?: string, payload?: Payload) {
    this.targetHash = hashRegister.requireHash(target)
    this.target = target
    this.type = type ?? 'message'
    this.payload = payload

    const listeners = (listenerMap.get(this.targetHash) ?? [])
      .filter(listener => listener.match(target, this.type))

    this.debug.listenerCount = listeners.length
    Object.assign(this.debug, { foo: listenerMap.get(this.targetHash) })

    for (const listener of listeners) {
      this.debug.currentListenerIndex++
      listener.callback(this)
    }
  }

  setPayload(payload: Payload): this {
    this.payload = payload
    return this
  }

  /**
   * Assign new payload props to the message. An optional "overwrite" parameter
   * can be used to specify if the new props should overwrite the existing ones.
   */
  assignPayload(payload: Partial<Payload>, { overwrite = true } = {}): this {
    this.payload = (overwrite
      ? { ...this.payload, ...payload }
      : { ...payload, ...this.payload }) as Payload
    return this
  }

  /**
   * @deprecated Use `assignPayload` instead.
   */
  payloadAssign(...args: Parameters<Message['assignPayload']>): this {
    return this.assignPayload(...args)
  }

  /**
   * Assert that the message has a payload and return it. This method is. If the 
   * payload is falsy, an error will be thrown.
   */
  assertPayload(errorMessage?: string): Payload {
    if (this.payload !== undefined) {
      return this.payload
    }

    throw new Error(`Message.assertPayload(${errorMessage ?? ''}): assertion failed for message with target "${this.target}"`)
  }
}

export { Message }

export type {
  Callback as MessageCallback,
  Listener as MessageListener
}

