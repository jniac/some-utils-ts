import { Destroyable } from '../types';
/**
 * Simplifies the destruction of objects and functions.
 *
 * Will execute the `destroy` method on all passed arguments, whether they are
 * objects or functions.
 */
export declare function destroy(...destroyables: Destroyable[]): void;
export declare function destroy(destroyables: Destroyable[]): void;
export declare class DestroyableInstance {
    destroyables: Destroyable[];
    collect(...values: (Destroyable | null | undefined | Iterable<Destroyable | null | undefined>)[]): void;
    /**
     * Destroy all collected destroyables.
     *
     * NOTE: This method is bound to the instance and can be passed as a callback.
     */
    destroy: () => void;
}
//# sourceMappingURL=destroy.d.ts.map