import { DeepPartial } from '../../types';
import { Path } from './deep';
export declare class DeepDiffResult<TypeA = any, TypeB = any> {
    objectA: TypeA;
    objectB: TypeB;
    aOnlyChanges: [Path, value: any][];
    bOnlyChanges: [Path, value: any][];
    bothChanges: [Path, aValue: any, bValue: any][];
    get totalChangeCount(): number;
    get aChangeCount(): number;
    get bChangeCount(): number;
    /**
     * Returns an object containing only the changes in `objectA`.
     *
     * Shortcut for `getAChangeObject()`.
     */
    get a(): DeepPartial<TypeA>;
    /**
     * Returns an object containing only the changes in `objectB`.
     *
     * Shortcut for `getBChangeObject()`.
     */
    get b(): DeepPartial<TypeB>;
    constructor(objectA: TypeA, objectB: TypeB);
    getAChanges(): Generator<any[], void, unknown>;
    getAChangeObject(): DeepPartial<TypeA>;
    getBChanges(): Generator<any[], void, unknown>;
    getBChangeObject(): DeepPartial<TypeB>;
    info(): string;
}
/**
 * Compares two objects deeply and returns the differences in a diff object.
 *
 * NOTE:
 * - `differences` is the total number of differences.
 * - `aDifferences` is the number of differences in `objectA`.
 * - `bDifferences` is the number of differences in `objectB`.
 * - `differences !== aDifferences + bDifferences` because some differences may be common.
 */
export declare function deepDiff<TypeA, TypeB>(objectA: TypeA, objectB: TypeB): DeepDiffResult<TypeA, TypeB>;
//# sourceMappingURL=diff.d.ts.map