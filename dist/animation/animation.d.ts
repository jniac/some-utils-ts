import { DestroyableObject } from '../types';
import { EaseDeclaration, parseEase, remap } from './easing';
/**
 * The safeword, when returned by a callback, stops the animation.
 *
 * Sometimes it's “red”, sometimes “yellow”, but here it's simply "pause" or "destroy".
 */
declare const safewords: readonly ["pause", "destroy"];
type Safeword = typeof safewords[number];
type Callback = (animation: AnimationInstance) => void | Safeword | any;
declare class AnimationInstance implements DestroyableObject {
    readonly id: number;
    readonly duration: number;
    readonly delay: number;
    readonly target: any;
    readonly prerun: boolean;
    readonly autoDestroy: boolean;
    destroyHasBeenRequested: boolean;
    unclampedTime: number;
    unclampedTimeOld: number;
    frame: number;
    timeScale: number;
    paused: boolean;
    time: number;
    timeOld: number;
    progress: number;
    get progressOld(): number;
    get complete(): boolean;
    get delayed(): boolean;
    get deltaTime(): number;
    get direction(): "forward" | "backward";
    constructor(duration: number, delay: number, timeScale: number, target: any, autoDestroy: boolean, prerun: boolean | undefined);
    onUpdate(callback: Callback): this;
    /**
     * Execute the callback when the animation starts (progress > 0 && progressOld === 0).
     * @deprecated Deprecated for now, not sure to have all the use cases covered (reverse playing etc.). Use `onPass(0, () => ...)` instead.
     */
    onStart(callback: Callback): this;
    /**
     * Execute the callback when the animation completes (progress === 1).
     */
    onComplete(callback: Callback): this;
    onThreshold({ 
    /**
     * The threshold value.
     */
    threshold, 
    /**
     * The direction to check.
     */
    direction, 
    /**
     * The mode to trigger the callback.
     * - 'reach': the callback is triggered when the progress reaches the threshold (is on the exact value or on the other side).
     * - 'pass': the callback is triggered when the progress passes the threshold (is on the other side).
     */
    mode, }: {
        threshold?: number | undefined;
        direction?: "forward" | "backward" | "both" | undefined;
        mode?: "reach" | "pass" | undefined;
    }, callback: Callback): this;
    onPass(threshold: number, callback: Callback): this;
    onReach(threshold: number, callback: Callback): this;
    onDestroy(callback: Callback): this;
    /**
     * Request the instance to be destroyed.
     *
     * NOTE: The instance is not destroyed immediately, it will be destroyed:
     * - at the end of the current update loop (if inside an update loop)
     * - at the end of the next update loop (if outside an update loop, callbacks will be ignored)
     */
    requestDestroy(): void;
    /**
     * Call internally the `requestDestroy` method. Here to implement the `DestroyableObject` interface.
     *
     * NOTE: The instance is not destroyed immediately, it will be destroyed as soon as possible, callbacks will be ignored.
     */
    destroy: () => void;
    /**
     * Lerps the current progress value.
     *
     * Usage:
     * ```
     * Animation
     *   .during(1)
     *   .onUpdate(({ progressLerp }) => {
     *     const alpha = progressLerp(.75, 1, 'cubic-bezier(.33, 0, .66, 1)')
     *   })
     * ```
     */
    progressLerp: (from: number, to: number, ease?: EaseDeclaration) => number;
    set({ paused, time, progress, timeScale, delay }?: Partial<{
        paused: boolean;
        time: number;
        progress: number;
        timeScale: number;
        delay: number;
    }>): this;
    /**
     * Applies a delay to the instance. Quite tricky.
     *
     * Delay is handled by setting the `unclampedTime` value out of the bounds of
     * the duration. If the time scale is positive, the time is set to `-delay`,
     * if the time scale is negative, the time is set to `duration + delay`.
     */
    applyDelay(value: number): this;
    /**
     * Pauses the instance.
     *
     * Convenient method to set `paused` to `true`, equivalent to:
     * ```
     * instance.set({ paused: true })
     * ```
     */
    pause(props?: number | Parameters<AnimationInstance['set']>[0]): this;
    /**
     * Resumes the instance.
     *
     * Convenient method to set `paused` to `false`, equivalent to:
     * ```
     * instance.set({ paused: false })
     * ```
     */
    play(props?: number | Parameters<AnimationInstance['set']>[0]): this;
    reverse(props?: number | Parameters<AnimationInstance['set']>[0]): this;
    /**
     * By design, to avoid conflicts between "above" and "below" methods:
     * - "above" is true when the time/progress is above or equal to the given value.
     * - "below" is true when the time/progress is strictly below the given value.
     */
    didPassAbove(props: Partial<{
        time: number;
        progress: number;
    }>): boolean;
    /**
     * By design, to avoid conflicts between "above" and "below" methods:
     * - "above" is true when the time/progress is above or equal to the given value.
     * - "below" is true when the time/progress is strictly below the given value.
     */
    didPassBelow(props: Partial<{
        time: number;
        progress: number;
    }>): boolean;
    didPass(props: Partial<{
        time: number;
        progress: number;
    }>): boolean;
}
declare function startAnimationLoop(): void;
declare function stopAnimationLoop(): void;
declare function existing(...targets: any[]): AnimationInstance[];
declare function clear(...targets: any[]): {
    remap: typeof remap;
    ease: typeof import("./easing").fromEaseDeclaration;
    during: typeof during;
    tween: typeof tween;
    existing: typeof existing;
    clear: typeof clear;
    safewords: readonly ["pause", "destroy"];
    core: {
        instancesCount: () => number;
        instances: () => AnimationInstance[];
        updateInstances: (deltaTime: number) => void;
        startAnimationLoop: typeof startAnimationLoop;
        stopAnimationLoop: typeof stopAnimationLoop;
    };
};
declare const defaultDuringArg: {
    /**
     * Duration in seconds.
     */
    duration: number;
    /**
     * Delay in seconds.
     */
    delay: number;
    /**
     * Time scale.
     */
    timeScale: number;
    /**
     * Target, if an instance is associated with a target, it will be destroyed
     * when a new instance is created for the same target.
     *
     * Target can be any value or a combination of values:
     * - `[myObject, 'myProperty']` won't conflict with `[myObject, 'myOtherProperty']`
     */
    target: any;
    /**
     * If true, any previous instance associated with the target will be destroyed.
     *
     * Defaults to `false`.
     */
    clear: boolean;
    /**
     * If true, the instance will be destroyed when it completes.
     *
     * If the animation is meant to be played again, set this to `false`.
     *
     * Defaults to `true`.
     */
    autoDestroy: boolean;
    /**
     * If true, the instance will be updated on the first frame.
     *
     * Defaults to the delay value (if any delay is set prerun will be set to true, otherwise it will be false).
     */
    prerun: undefined | boolean;
};
type DuringArg = Partial<typeof defaultDuringArg>;
/**
 *
 * @param duration duration in seconds
 */
declare function during(arg: DuringArg | number): AnimationInstance;
declare const defaultTweenArg: {
    ease: EaseDeclaration;
    timeScale: number;
    delay: number;
    duration: number;
    clear: boolean;
    autoDestroy: boolean;
    prerun: undefined | boolean;
};
type TweenEntry = {
    from: number;
    to: number;
    target: Record<string, any>;
    key: string;
};
type TweenInstanceAddArg = {
    target: any;
    from?: any;
    to?: any;
};
declare class TweenInstance extends AnimationInstance {
    entries: TweenEntry[];
    add(arg: TweenInstanceAddArg | TweenInstanceAddArg[]): this;
}
type TweenArg<T> = {
    target: T | T[];
} & Partial<typeof defaultTweenArg & {
    from: Record<string, any>;
    to: Record<string, any>;
}>;
/**
 * Usage:
 * ```
 * Animation.tween({
 *   target: myVector,
 *   to: { x: 1 },
 *   duration: 1,
 *   ease: 'inOut3',
 * })
 */
declare function tween<T extends Record<string, any>>(arg: TweenArg<T>): TweenInstance;
/**
 * Low-level animation utility.
 *
 * Usage:
 * ```ts
 * Animation
 *   .during({ duration: 1, delay: .4, target: 'foo' })
 *   .onUpdate(({ progress }) => { })
 *
 * Animation
 *   .during(1)
 *   .onUpdate(({ progress }) => {
 *   })
 * ```
 */
declare const AnimationModule: {
    remap: typeof remap;
    ease: typeof import("./easing").fromEaseDeclaration;
    during: typeof during;
    tween: typeof tween;
    existing: typeof existing;
    clear: typeof clear;
    safewords: readonly ["pause", "destroy"];
    core: {
        instancesCount: () => number;
        instances: () => AnimationInstance[];
        updateInstances: (deltaTime: number) => void;
        startAnimationLoop: typeof startAnimationLoop;
        stopAnimationLoop: typeof stopAnimationLoop;
    };
};
export type { Callback as AnimationCallback, TweenArg as AnimationTweenArg, TweenInstance as AnimationTweenInstance };
export { AnimationModule as Animation, parseEase, remap };
