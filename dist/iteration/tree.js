const commonOptionsDefaults = () => ({
    /**
     * A function that returns true if the current node should be included in the result.
     * - By default, all nodes are included.
     * - If `false`, the node and all its ascendants or descendants will be excluded.
     *   - In ascendants, this will stop the traversal, useful for simulating partial rooted trees.
     *   - In descendants, this will stop the traversal, useful for pruning the tree.
     */
    filter: (() => true),
    /**
     * Whether to include the node itself in the result.
     */
    includeFirstNode: true,
    /**
     * The maximum number of nodes to return.
     * - If `Infinity`, all nodes will be returned.
     * - If a number, the first `n` nodes will be returned, depending on the method.
     */
    nodesMax: 1e6,
});
const allAscendantsOfOptionsDefaults = () => ({
    ...commonOptionsDefaults(),
    /**
     * A function that returns the parent of the node.
     */
    getParent: (node => node.parent),
});
export function* allAscendantsOf(firstNode, options = {}) {
    const { nodesMax, includeFirstNode, filter, getParent, } = { ...allAscendantsOfOptionsDefaults(), ...options };
    let count = 0;
    const visited = new Set();
    let current = includeFirstNode ? firstNode : getParent(firstNode);
    while (current) {
        if (filter(current) === false) {
            break;
        }
        if (visited.has(current)) {
            console.warn('Tree traversal visited the same node twice', current);
            break;
        }
        visited.add(current);
        yield { node: current };
        count++;
        if (count >= nodesMax) {
            break;
        }
        current = getParent(current);
    }
}
export function computeDepth(firstNode, options) {
    let depth = 0;
    for (const _ of allAscendantsOf(firstNode, { ...options, includeFirstNode: false })) {
        depth++;
    }
    return depth;
}
const allDescendantsOfOptionsDefaults = () => ({
    ...commonOptionsDefaults(),
    /**
     * A function that returns the children of the node.
     */
    getChildren: (node => node.children),
    /**
     * The method to use for traversing the tree.
     * - `depth-first` will traverse the tree depth-first.
     * - `breadth-first` will traverse the tree breadth-first.
     */
    method: 'depth-first',
});
export function* allDescendantsOf(firstNode, options = {}) {
    const { nodesMax, includeFirstNode, method, filter, getChildren, } = { ...allDescendantsOfOptionsDefaults(), ...options };
    let count = 0;
    const queue = includeFirstNode ? [firstNode] : [...getChildren(firstNode)];
    const visited = new Set();
    while (queue.length > 0) {
        const current = queue.shift();
        if (filter(current) === false) {
            continue;
        }
        yield { node: current };
        count++;
        if (count >= nodesMax) {
            break;
        }
        if (visited.has(current)) {
            console.warn('Tree traversal visited the same node twice', current);
            continue;
        }
        visited.add(current);
        const children = getChildren(current);
        if (method === 'depth-first') {
            queue.unshift(...children);
        }
        else {
            queue.push(...children);
        }
    }
}
