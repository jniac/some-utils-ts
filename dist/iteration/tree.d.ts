type ChildrenAccessor<T> = (node: T) => Iterable<T>;
type ParentAccessor<T> = (node: T) => T | undefined;
type FilterPredicate<T> = (node: T) => boolean;
declare const allAscendantsOfOptionsDefaults: <T>() => {
    /**
     * A function that returns the parent of the node.
     */
    getParent: ParentAccessor<T>;
    /**
     * A function that returns true if the current node should be included in the result.
     * - By default, all nodes are included.
     * - If `false`, the node and all its ascendants or descendants will be excluded.
     *   - In ascendants, this will stop the traversal, useful for simulating partial rooted trees.
     *   - In descendants, this will stop the traversal, useful for pruning the tree.
     */
    filter: FilterPredicate<T>;
    /**
     * Whether to include the node itself in the result.
     */
    includeFirstNode: boolean;
    /**
     * The maximum number of nodes to return.
     * - If `Infinity`, all nodes will be returned.
     * - If a number, the first `n` nodes will be returned, depending on the method.
     */
    nodesMax: number;
};
export declare function allAscendantsOf<T>(firstNode: T, options?: Partial<typeof allAscendantsOfOptionsDefaults>): Generator<{
    node: T;
}>;
export declare function computeDepth<T>(firstNode: T, options: Omit<Parameters<typeof allAscendantsOf>[1], 'includeFirstNode'>): number;
declare const allDescendantsOfOptionsDefaults: <T>() => {
    /**
     * A function that returns the children of the node.
     */
    getChildren: ChildrenAccessor<T>;
    /**
     * The method to use for traversing the tree.
     * - `depth-first` will traverse the tree depth-first.
     * - `breadth-first` will traverse the tree breadth-first.
     */
    method: "depth-first" | "breadth-first";
    /**
     * A function that returns true if the current node should be included in the result.
     * - By default, all nodes are included.
     * - If `false`, the node and all its ascendants or descendants will be excluded.
     *   - In ascendants, this will stop the traversal, useful for simulating partial rooted trees.
     *   - In descendants, this will stop the traversal, useful for pruning the tree.
     */
    filter: FilterPredicate<T>;
    /**
     * Whether to include the node itself in the result.
     */
    includeFirstNode: boolean;
    /**
     * The maximum number of nodes to return.
     * - If `Infinity`, all nodes will be returned.
     * - If a number, the first `n` nodes will be returned, depending on the method.
     */
    nodesMax: number;
};
export declare function allDescendantsOf<T>(firstNode: T, options?: Partial<typeof allDescendantsOfOptionsDefaults>): Generator<{
    node: T;
}>;
export {};
//# sourceMappingURL=tree.d.ts.map