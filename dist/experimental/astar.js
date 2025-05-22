import { pairwise } from '../iteration/utils.js';
import { distance2, manhattanDistance2 } from '../math/geom/geom2.js';
/**
 * Definitively generic A* pathfinding algorithm:
 * - `Node` is the type of the nodes in the graph, could be anything.
 * - neighbors and heuristic cost are provided by delegates.
 */
export function aStar(params) {
    const { start, goal, getNeighbors, heuristic, customNeighborHeuristic } = params;
    const openSet = new Set([start]);
    const cameFrom = new Map();
    /**
     * gScore = cost of the cheapest path from start to node
     */
    const gScore = new Map();
    gScore.set(start, 0);
    let current = start, neighbor = start;
    const info = {
        start,
        goal,
        get neighbor() { return neighbor; },
        wayback: (count = Infinity) => wayback(current, cameFrom, count),
    };
    /**
     * fScore = gScore + heuristic
     */
    const fScore = new Map();
    fScore.set(start, heuristic(start, goal));
    while (openSet.size > 0) {
        let lowest = undefined;
        let currentFScore = Infinity;
        // Find the node in openSet having the lowest fScore
        for (const node of openSet) {
            const score = fScore.get(node) ?? Infinity;
            if (score < currentFScore) {
                lowest = node;
                currentFScore = score;
            }
        }
        if (!lowest)
            break;
        current = lowest;
        if (current === goal)
            return reconstructPath(cameFrom, current);
        openSet.delete(current);
        for (const { node, cost: defaultCost } of getNeighbors(current)) {
            neighbor = node;
            // If a custom heuristic is provided, use it to compute the cost of moving to the neighbor
            const cost = customNeighborHeuristic?.(info) ?? defaultCost;
            const tentativeGScore = (gScore.get(current) ?? Infinity) + cost;
            if (tentativeGScore < (gScore.get(neighbor) ?? Infinity)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, tentativeGScore + heuristic(neighbor, goal));
                openSet.add(neighbor);
            }
        }
    }
    return []; // No path found
}
function* wayback(current, cameFrom, countMax = Infinity) {
    let count = 0;
    while (count++ < countMax) {
        yield current;
        const next = cameFrom.get(current);
        if (next === undefined)
            break;
        current = next;
        if (count > 1000) {
            console.log(count);
            throw new Error('Infinite loop?');
        }
    }
}
function reconstructPath(cameFrom, current) {
    return [...wayback(current, cameFrom)].reverse();
}
export class AStar {
    openSet = new Set();
    cameFrom = new Map();
    gScore = new Map();
    fScore = new Map();
    params;
    start;
    goal;
    current;
    neighbor;
    wayback;
    constructor(params) {
        this.params = params;
        const { start, goal, heuristic } = params;
        this.current = start;
        this.neighbor = start;
        this.openSet.add(start);
        this.gScore.set(start, 0);
        this.fScore.set(start, heuristic(start, goal));
        this.start = start;
        this.goal = goal;
        this.wayback = (count = Infinity) => wayback(this.current, this.cameFrom, count);
    }
    next() {
        if (this.openSet.size === 0)
            return null;
        let lowest = undefined;
        let currentFScore = Infinity;
        for (const node of this.openSet) {
            const score = this.fScore.get(node) ?? Infinity;
            if (score < currentFScore) {
                lowest = node;
                currentFScore = score;
            }
        }
        if (!lowest)
            return null;
        this.current = lowest;
        if (this.current === this.params.goal) {
            return reconstructPath(this.cameFrom, this.current);
        }
        this.openSet.delete(this.current);
        for (const { node, cost: defaultCost } of this.params.getNeighbors(this.current)) {
            this.neighbor = node;
            const cost = this.params.customNeighborHeuristic?.(this) ?? defaultCost;
            const tentativeGScore = (this.gScore.get(this.current) ?? Infinity) + cost;
            if (tentativeGScore < (this.gScore.get(this.neighbor) ?? Infinity)) {
                this.cameFrom.set(this.neighbor, this.current);
                this.gScore.set(this.neighbor, tentativeGScore);
                this.fScore.set(this.neighbor, tentativeGScore + this.params.heuristic(this.neighbor, this.params.goal));
                this.openSet.add(this.neighbor);
            }
        }
        return null;
    }
    /**
     * Finds the path from start to goal using the A* algorithm.
     * Returns an array of nodes representing the path.
     */
    findPath() {
        const { openSet } = this;
        while (openSet.size > 0) {
            const path = this.next();
            if (path)
                return path;
        }
        return [];
    }
    /**
     * @deprecated Use `findPath` instead.
     */
    solve() {
        return this.findPath();
    }
}
export class Graph2 {
    #map = new Map();
    #links = new Set();
    nodes = () => this.#map.keys();
    links = () => this.#links.values();
    heuristic;
    getNeighbors;
    constructor(nodes, { 
    /**
     * Delegate to compute the cost of moving from node `a` to node `b`.
     * By default, it computes the euclidean distance between the two nodes.
     *
     * NOTE: The heuristic will be called twice for each link, once for `a` to `b`
     * and once for `b` to `a`. Results may differ if the heuristic is not symmetric.
     */
    heuristic = (a, b) => distance2(a, b), } = {}) {
        const map = this.#map;
        for (const node of nodes) {
            map.set(node, new Set());
        }
        this.heuristic = heuristic;
        // To implement the Graph interface, getNeighbors must be binded to this instance
        this.getNeighbors = function* (node) {
            const links = map.get(node);
            if (!links)
                return;
            for (const { a, b, costAB, costBA } of links) {
                yield a === node
                    ? { node: b, cost: costAB }
                    : { node: a, cost: costBA };
            }
        };
    }
    computeLinks({ 
    /**
     * The grid step used to determine if two nodes are neighbors (useless if `areNeighbors` is provided).
     * Default is 1.
     */
    gridStep = 1, 
    /**
     * Delegate to determine if two nodes are neighbors.
     * By default, two nodes are neighbors if they are at most `gridStep` distance apart (manhattan distance).
     */
    areNeighbors = (a, b) => manhattanDistance2(a, b) <= gridStep + .0001, } = {}) {
        const map = this.#map;
        const links = this.#links;
        const { heuristic } = this;
        for (const node of map.keys()) {
            map.get(node).clear();
        }
        const processed = new Set();
        for (const node of map.keys()) {
            for (const other of map.keys()) {
                if (node === other || processed.has(other))
                    continue;
                if (areNeighbors(node, other)) {
                    const a = node;
                    const b = other;
                    const costAB = heuristic(a, b);
                    const costBA = heuristic(b, a);
                    const link = { a, b, costAB, costBA };
                    map.get(a).add(link);
                    map.get(b).add(link);
                    links.add(link);
                }
            }
            processed.add(node);
        }
        return this;
    }
    findLink(a, b) {
        const links = this.#map.get(a);
        if (!links)
            return null;
        for (const link of links) {
            if (link.a === b || link.b === b)
                return link;
        }
    }
    findPath(start, goal, customNeighborHeuristic) {
        const { getNeighbors, heuristic } = this;
        const astar = new AStar({
            start,
            goal,
            getNeighbors,
            heuristic,
            customNeighborHeuristic,
        });
        return astar.findPath();
    }
    pathIsValid(path) {
        for (const [a, b] of pairwise(path)) {
            const links = this.#map.get(a);
            if (!links)
                return false;
            if (![...links].some(link => link.a === b || link.b === b))
                return false;
        }
        return true;
    }
}
//# sourceMappingURL=astar.js.map