import { Path } from '../object/deep';
import { DeepDiffResult } from '../object/deep/diff';
import { DeepPartial } from '../types';
import { Observable, SetValueOptions } from './observable';
type PartialChangeCallback<T, SubType> = (partialValue: SubType, partialValueOld: SubType, info: {
    observable: ObservableTree<T>;
    path: Path;
}) => void;
/**
 * An observable that "deeply" tracks changes to its value.
 *
 * Usage:
 * ```
 * const o = new ObservableTree({ foo: { bar: 2, qux: 3 } })
 * o.onMutation('foo', (v, { partialValueOld, path }) => {
 *   console.log(path.join('.'), v, partialValueOld)
 * })
 * o.onMutation('foo.bar', (v, { partialValueOld, path }) => {
 *   console.log(path.join('.'), v, partialValueOld)
 * })
 * o.setMutation({ foo: { bar: 12 } })
 * ```
 *
 * NOTE:
 *
 * This observable is quite expensive to use since any change set with
 * `setMutation` will trigger a deep diff and  a deep clone. Use with caution.
 * For frequent changes (e.g. multiple mutation), consider using `enqueueMutation`
 * and `flushMutations` instead.
 *
 * ```
 * const o = new ObservableTree({ foo: { bar: 2, qux: 3 } })
 * o.onMutation('foo', (v, { partialValueOld, path }) => {
 *   console.log(path.join('.'), v, partialValueOld)
 * })
 * o.onMutation('foo.bar', (v, { partialValueOld, path }) => {
 *   console.log(path.join('.'), v, partialValueOld)
 * })
 * o.enqueueMutation({ foo: { bar: 12 } })
 * o.enqueueMutation({ foo: { qux: 23 } })
 * o.enqueueMutation({ foo: { baz: 34 } })
 * o.flushMutations() // only triggers one deep diff and one deep clone
 * ```
 */
export declare class ObservableTree<T> extends Observable<T> {
    diff: DeepDiffResult;
    private _pendingMutations;
    mutate: (typeof this)['setMutation'];
    setMutation(mutation: DeepPartial<T> | [path: string | Path, value: any], options?: SetValueOptions): boolean;
    /**
     * Enqueue a partial value to be set later.
     */
    enqueueMutation(mutation: DeepPartial<T> | [path: string | Path, value: any]): this;
    /**
     * Flush all pending mutations.
     */
    flushMutations(options?: SetValueOptions): boolean;
    setValue(incomingValue: T, options?: SetValueOptions): boolean;
    onMutation<SubType = any>(path: string | Path, callback: PartialChangeCallback<T, SubType>): import("../types").DestroyableObject;
}
export {};
