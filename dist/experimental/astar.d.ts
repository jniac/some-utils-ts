import { Vector2Like } from '../types';
type AStarHookInfo<Node> = {
    neighbor: Node;
    start: Node;
    goal: Node;
    wayback: (count?: number) => Generator<Node>;
};
type AStarParams<Node> = {
    start: Node;
    goal: Node;
    getNeighbors: (node: Node) => Iterable<{
        node: Node;
        cost: number;
    }>;
    heuristic: (node: Node, goal: Node) => number;
    /**
     * Custom hook to compute the heuristic cost of a neighbor.
     * If provided, this hook will be called for each neighbor of the current node,
     * and the result will be used instead of the default heuristic cost.
     */
    customNeighborHeuristic?: (info: AStarHookInfo<Node>) => number;
};
/**
 * Definitively generic A* pathfinding algorithm:
 * - `Node` is the type of the nodes in the graph, could be anything.
 * - neighbors and heuristic cost are provided by delegates.
 */
export declare function aStar<Node>(params: AStarParams<Node>): Node[];
export declare class AStar<Node> implements AStarHookInfo<Node> {
    openSet: Set<Node>;
    cameFrom: Map<Node, Node>;
    gScore: Map<Node, number>;
    fScore: Map<Node, number>;
    params: AStarParams<Node>;
    start: Node;
    goal: Node;
    current: Node;
    neighbor: Node;
    wayback: (count?: number) => Generator<Node, any, any>;
    constructor(params: AStarParams<Node>);
    next(): Node[] | null;
    solve(): Node[];
}
type Link<Node> = {
    a: Node;
    b: Node;
    costAB: number;
    costBA: number;
};
type Graph<Node> = {
    nodes(): Iterable<Node>;
    links(): Iterable<Link<Node>>;
    getNeighbors: (node: Node) => Iterable<{
        node: Node;
        cost: number;
    }>;
    heuristic: (a: Node, b: Node) => number;
    findPath(start: Node, goal: Node): Node[];
    pathIsValid(path: Node[]): boolean;
};
export declare class Graph2<Node extends Vector2Like> implements Graph<Node> {
    #private;
    nodes: () => MapIterator<Node>;
    links: () => SetIterator<Link<Node>>;
    heuristic: (a: Node, b: Node) => number;
    getNeighbors: (node: Node) => Iterable<{
        node: Node;
        cost: number;
    }>;
    constructor(nodes: Iterable<Node>, { 
    /**
     * Delegate to compute the cost of moving from node `a` to node `b`.
     * By default, it computes the euclidean distance between the two nodes.
     *
     * NOTE: The heuristic will be called twice for each link, once for `a` to `b`
     * and once for `b` to `a`. Results may differ if the heuristic is not symmetric.
     */
    heuristic, }?: {
        heuristic?: ((a: Node, b: Node) => number) | undefined;
    });
    computeLinks({ 
    /**
     * The grid step used to determine if two nodes are neighbors (useless if `areNeighbors` is provided).
     * Default is 1.
     */
    gridStep, 
    /**
     * Delegate to determine if two nodes are neighbors.
     * By default, two nodes are neighbors if they are at most `gridStep` distance apart (manhattan distance).
     */
    areNeighbors, }?: {
        gridStep?: number | undefined;
        areNeighbors?: ((a: Node, b: Node) => boolean) | undefined;
    }): this;
    findLink(a: Node, b: Node): Link<Node> | null | undefined;
    findPath(start: Node, goal: Node, customNeighborHeuristic?: (info: AStarHookInfo<Node>) => number): Node[];
    pathIsValid(path: Node[]): boolean;
}
export {};
