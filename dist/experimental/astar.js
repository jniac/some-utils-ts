import { pairwise } from '../iteration/utils.js';
import { distance2, manhattanDistance2 } from '../math/geom/geom2.js';
/**
 * Definitively generic A* pathfinding algorithm:
 * - `Node` is the type of the nodes in the graph, could be anything.
 * - neighbors and heuristic cost are provided by delegates.
 */
export function aStar({ start, goal, getNeighbors, heuristic }) {
    const openSet = new Set([start]);
    const cameFrom = new Map();
    const gScore = new Map();
    gScore.set(start, 0);
    const fScore = new Map();
    fScore.set(start, heuristic(start, goal));
    while (openSet.size > 0) {
        let current = undefined;
        let currentFScore = Infinity;
        for (const node of openSet) {
            const score = fScore.get(node) ?? Infinity;
            if (score < currentFScore) {
                current = node;
                currentFScore = score;
            }
        }
        if (!current)
            break;
        if (current === goal) {
            return reconstructPath(cameFrom, current);
        }
        openSet.delete(current);
        for (const { node: neighbor, cost } of getNeighbors(current)) {
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
function reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        path.push(current);
    }
    return path.reverse();
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
    heuristic = (a, b) => distance2(a.getPosition(), b.getPosition()), } = {}) {
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
    areNeighbors = (a, b) => manhattanDistance2(a.getPosition(), b.getPosition()) <= gridStep + .0001, } = {}) {
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
    findPath(start, goal) {
        const { getNeighbors, heuristic } = this;
        return aStar({
            start,
            goal,
            getNeighbors,
            heuristic,
        });
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
