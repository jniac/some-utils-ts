/**
 * Deep recursive check of "equivalence".
 *
 * "equivalence" means:
 * - if primitives:
 *   - same values
 * - otherwise:
 *   - if arrays:
 *     - same lengths & "equivalent" values by index
 *   - if objects:
 *     - same number of props, with same name, with "equivalent" values
 *
 * NOTE:
 * - No support for Set, Map (& weak equivalent) for the moment!
 * - Only enumerable keys are taken into account (Object.keys()).
 */
export declare function areEquivalent(a: any, b: any): boolean;
export declare function isEquivalentSubsetOf(subsetCandidate: any, parent: any): boolean;
//# sourceMappingURL=equivalence.d.ts.map