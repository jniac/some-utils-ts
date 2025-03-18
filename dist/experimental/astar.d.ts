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
type Link<Node> = {
    a: Node;
    b: Node;
    cost: number;
};
type Graph<Node> = {
    links(): Iterable<Link<Node>>;
    getNeighbors: (node: Node) => Iterable<{
        node: Node;
        cost: number;
    }>;
    heuristic: (a: Node, b: Node) => number;
    findPath(start: Node, goal: Node): Node[];
    pathIsValid(path: Node[]): boolean;
};
type Graph2Node = {
    getPosition(): Vector2Like;
};
export declare class Graph2<Node extends Graph2Node> implements Graph<Node> {
    #private;
    links: () => Set<Link<Node>>;
    getNeighbors: (node: Node) => Iterable<{
        node: Node;
        cost: number;
    }>;
    heuristic: (a: Node, b: Node) => number;
    constructor(nodes: Iterable<Node>, { 
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
    });
    findLink(a: Node, b: Node): Link<Node> | undefined;
    findPath(start: Node, goal: Node): Node[];
    pathIsValid(path: Node[]): boolean;
}
export {};
