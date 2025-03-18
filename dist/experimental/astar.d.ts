import { Vector2Like } from '../types';
type AStarParams<Node> = {
    start: Node;
    goal: Node;
    getNeighbors: (node: Node) => Iterable<{
        node: Node;
        cost: number;
    }>;
    heuristic: (node: Node, goal: Node) => number;
};
/**
 * Definitively generic A* pathfinding algorithm:
 * - `Node` is the type of the nodes in the graph, could be anything.
 * - neighbors and heuristic cost are provided by delegates.
 */
export declare function aStar<Node>({ start, goal, getNeighbors, heuristic }: AStarParams<Node>): Node[];
type Graph2Node = {
    getPosition(): Vector2Like;
};
export declare function createGraph2<Node extends Graph2Node>(nodes: Iterable<Node>, { 
/**
 * The grid step used to determine if two nodes are neighbors (useless if `areNeighbors` is provided).
 * Default is 1.
 */
gridStep, 
/**
 * Delegate to determine if two nodes are neighbors.
 * By default, two nodes are neighbors if they are at most `gridStep` distance apart (manhattan distance).
 */
areNeighbors, 
/**
 * Delegate to compute the cost of moving from node `a` to node `b`.
 * By default, it computes the euclidean distance between the two nodes.
 */
heuristic, }?: {
    gridStep?: number | undefined;
    areNeighbors?: ((a: Node, b: Node) => boolean) | undefined;
    heuristic?: ((a: Node, b: Node) => number) | undefined;
}): {
    map: Map<Node, Set<{
        a: Node;
        b: Node;
        cost: number;
    }>>;
    readonly nodeCount: number;
    readonly linkCount: number;
    links: () => SetIterator<{
        a: Node;
        b: Node;
        cost: number;
    }>;
    getNeighbors: (node: Node) => Generator<{
        node: Node;
        cost: number;
    }>;
    heuristic: (a: Node, b: Node) => number;
    findLink: (a: Node, b: Node) => {
        a: Node;
        b: Node;
        cost: number;
    } | undefined;
    findPath: (start: Node, goal: Node) => Node[];
    pathIsValid: (path: Node[]) => boolean;
};
export {};
