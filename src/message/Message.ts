import { DestroyableObject, OneOrMany, StringMatcher } from '../types'
import { IdRegister } from './IdRegister'

type Callback<P = any> = {
  (message: Message<P>): void
}

class Listener {
  filter: StringMatcher
  callback: Callback
  match: (type: string) => boolean
  constructor(filter: StringMatcher, callback: Callback) {
    this.filter = filter
    this.callback = callback
    this.match = (
      filter === '*' ? () => true :
        typeof filter === 'string' ? (type: string) => type === filter :
          filter instanceof RegExp ? (type: string) => filter.test(type) :
            () => false)
  }
}

const idRegister = new IdRegister()
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
 * - any combination of the two (via an array, order-sensitive)
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
class Message<P = any> {
  /**
   * Send a message.
   */
  static send = send

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
  static sendDual = sendDual

  /**
   * Listen to messages.
   */
  static on = on

  /**
   * Wait for a message to be sent, returns a promise that resolves when the message is sent.
   */
  static wait = wait

  static debug = { listenerMap, idRegister }

  private static nextId = 0
  readonly id = Message.nextId++
  readonly targetId: number

  target: any
  type: string
  payload?: P

  debug = { currentListenerIndex: -1, listenerCount: 0 }

  constructor(target: any, type?: string, payload?: P) {
    this.targetId = idRegister.requireId(target)
    this.target = target
    this.type = type ?? 'message'
    this.payload = payload

    const listeners = (listenerMap.get(this.targetId) ?? [])
      .filter(listener => listener.match(this.type))

    this.debug.listenerCount = listeners.length

    for (const listener of listeners) {
      this.debug.currentListenerIndex++
      listener.callback(this)
    }
  }

  setPayload(payload: P): this {
    this.payload = payload
    return this
  }

  /**
   * Assign new payload props to the message. An optional "overwrite" parameter
   * can be used to specify if the new props should overwrite the existing ones.
   */
  assignPayload(payload: Partial<P>, { overwrite = true } = {}): this {
    this.payload = (overwrite
      ? { ...this.payload, ...payload }
      : { ...payload, ...this.payload }) as P
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
  assertPayload(errorMessage?: string): P {
    if (this.payload !== undefined) {
      return this.payload
    }

    throw new Error(`Message.assertPayload(${errorMessage ?? ''}): assertion failed for message with target "${this.target}"`)
  }
}

function solveOnArgs<P = any>(args: any[]): [target: any, filter: StringMatcher[], callback: Callback<P>] {
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
function on<P = any>(target: any, callback: (message: Message<P>) => void): DestroyableObject
function on<P = any>(target: any, filter: OneOrMany<StringMatcher>, callback: (message: Message<P>) => void): DestroyableObject
function on<P = any>(...args: any): DestroyableObject {
  const [target, filters, callback] = solveOnArgs<P>(args)
  const targetId = idRegister.requireId(target)
  const listeners = filters.map(filter => new Listener(filter, callback))
  requireListeners(targetId).push(...listeners)
  const destroy = () => {
    for (const listener of listeners)
      removeListener(targetId, listener)
  }
  return { destroy }
}

function wait<P = any>(target: any): Promise<Message<P>>
function wait<P = any>(target: any, filter: StringMatcher): Promise<Message<P>>
function wait<P = any>(...args: any): Promise<Message<P>> {
  return new Promise(resolve => {
    const callback = (message: Message<P>) => {
      resolve(message)
    }
    const [target, filters] = solveOnArgs<P>([...args, callback])
    on(target, filters, callback)
  })
}

function solveSendArgs<P = any>(args: any[]): [target: any, type?: string, payload?: P] {
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

function send<P = any>(target: any): Message<P>
function send<P = any>(target: any, type: string): Message<P>
function send<P = any>(target: any, options: { payload: P }): Message<P>
function send<P = any>(target: any, type: string, options: { payload: P }): Message<P>
function send<P = any>(...args: any[]): Message<P> {
  const [target, type, payload] = solveSendArgs<P>(args)
  return new Message(target, type, payload)
}

function sendDual(target: any, type: string, extraPayload: Omit<Record<string, any>, 'target'> = {}) {
  const payload = { target, ...extraPayload }
  send(type, { payload })
  send(target, type, { payload })
}

export { Message }
export type {
  Callback as MessageCallback,
  Listener as MessageListener
}

