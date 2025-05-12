import { IdRegister } from './IdRegister.js';
class Listener {
    filter;
    callback;
    match;
    constructor(filter, callback) {
        this.filter = filter;
        this.callback = callback;
        this.match = (filter === '*' ? () => true :
            typeof filter === 'string' ? (type) => type === filter :
                filter instanceof RegExp ? (type) => filter.test(type) :
                    () => false);
    }
}
const idRegister = new IdRegister();
const listenerMap = new Map();
function requireListeners(id) {
    return listenerMap.get(id) ?? (() => {
        const listeners = [];
        listenerMap.set(id, listeners);
        return listeners;
    })();
}
function removeListener(id, listener) {
    const listeners = listenerMap.get(id);
    if (listeners) {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
            if (listeners.length === 0) {
                listenerMap.delete(id);
            }
            return true;
        }
    }
    return false;
}
/**
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
class Message {
    static send = send;
    static on = on;
    static wait = wait;
    static debug = { listenerMap, idRegister };
    static nextId = 0;
    id = Message.nextId++;
    targetId;
    target;
    type;
    payload;
    debug = { currentListenerIndex: -1, listenerCount: 0 };
    constructor(target, type, payload) {
        this.targetId = idRegister.requireId(target);
        this.target = target;
        this.type = type ?? 'message';
        this.payload = payload;
        const listeners = (listenerMap.get(this.targetId) ?? [])
            .filter(listener => listener.match(this.type));
        this.debug.listenerCount = listeners.length;
        for (const listener of listeners) {
            this.debug.currentListenerIndex++;
            listener.callback(this);
        }
    }
    setPayload(payload) {
        this.payload = payload;
        return this;
    }
    /**
     * Assign new payload props to the message. An optional "overwrite" parameter
     * can be used to specify if the new props should overwrite the existing ones.
     */
    assignPayload(payload, { overwrite = true } = {}) {
        this.payload = (overwrite
            ? { ...this.payload, ...payload }
            : { ...payload, ...this.payload });
        return this;
    }
    /**
     * @deprecated Use `assignPayload` instead.
     */
    payloadAssign(...args) {
        return this.assignPayload(...args);
    }
    /**
     * Assert that the message has a payload and return it. This method is. If the
     * payload is falsy, an error will be thrown.
     */
    assertPayload() {
        if (this.payload !== undefined) {
            return this.payload;
        }
        throw new Error(`Message.payloadAssert: assertion failed for message with target "${this.target}"`);
    }
}
function solveOnArgs(args) {
    if (args.length === 2) {
        const [target, callback] = args;
        return [target, '*', callback];
    }
    return args;
}
function on(...args) {
    const [target, filter, callback] = solveOnArgs(args);
    const targetId = idRegister.requireId(target);
    const listener = new Listener(filter, callback);
    requireListeners(targetId).push(listener);
    const destroy = () => {
        removeListener(targetId, listener);
    };
    return { destroy };
}
function wait(...args) {
    return new Promise(resolve => {
        const callback = (message) => {
            resolve(message);
        };
        const [target, filter] = solveOnArgs([...args, callback]);
        on(target, filter, callback);
    });
}
function solveSendArgs(args) {
    const [target, ...rest] = args;
    if (rest.length === 2) {
        const [type, { payload }] = rest;
        return [target, type, payload];
    }
    if (rest.length === 1) {
        const [arg2] = rest;
        return typeof arg2 === 'string' ? [target, arg2] : [target, undefined, arg2.payload];
    }
    return [target];
}
function send(...args) {
    const [target, type, payload] = solveSendArgs(args);
    return new Message(target, type, payload);
}
export { Message };
//# sourceMappingURL=Message.js.map