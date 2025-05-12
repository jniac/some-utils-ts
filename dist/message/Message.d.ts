import { DestroyableObject, StringMatcher } from '../types';
import { IdRegister } from './IdRegister';
type Callback<P = any> = {
    (message: Message<P>): void;
};
declare class Listener {
    filter: StringMatcher;
    callback: Callback;
    match: (type: string) => boolean;
    constructor(filter: StringMatcher, callback: Callback);
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
declare class Message<P = any> {
    static send: typeof send;
    static on: typeof on;
    static wait: typeof wait;
    static debug: {
        listenerMap: Map<number, Listener[]>;
        idRegister: IdRegister;
    };
    private static nextId;
    readonly id: number;
    readonly targetId: number;
    target: any;
    type: string;
    payload?: P;
    debug: {
        currentListenerIndex: number;
        listenerCount: number;
    };
    constructor(target: any, type?: string, payload?: P);
    setPayload(payload: P): this;
    /**
     * Assign new payload props to the message. An optional "overwrite" parameter
     * can be used to specify if the new props should overwrite the existing ones.
     */
    assignPayload(payload: Partial<P>, { overwrite }?: {
        overwrite?: boolean | undefined;
    }): this;
    /**
     * @deprecated Use `assignPayload` instead.
     */
    payloadAssign(...args: Parameters<Message['assignPayload']>): this;
    /**
     * Assert that the message has a payload and return it. This method is. If the
     * payload is falsy, an error will be thrown.
     */
    assertPayload(): P;
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
declare function on<P = any>(target: any, callback: (message: Message<P>) => void): DestroyableObject;
declare function on<P = any>(target: any, filter: StringMatcher, callback: (message: Message<P>) => void): DestroyableObject;
declare function wait<P = any>(target: any): Promise<Message<P>>;
declare function wait<P = any>(target: any, filter: StringMatcher): Promise<Message<P>>;
declare function send<P = any>(target: any): Message<P>;
declare function send<P = any>(target: any, type: string): Message<P>;
declare function send<P = any>(target: any, options: {
    payload: P;
}): Message<P>;
declare function send<P = any>(target: any, type: string, options: {
    payload: P;
}): Message<P>;
export { Message };
export type { Callback as MessageCallback, Listener as MessageListener };
//# sourceMappingURL=Message.d.ts.map