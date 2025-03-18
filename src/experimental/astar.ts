import { pairwise } from '../iteration/utils'
import { distance2, manhattanDistance2 } from '../math/geom/geom2'
import { Vector2Like } from '../types'

type AStarParams<Node> = {
  start: Node
  goal: Node
  getNeighbors: (node: Node) => Iterable<{ node: Node, cost: number }>
  heuristic: (node: Node, goal: Node) => number
}

/**
 * Definitively generic A* pathfinding algorithm:
 * - `Node` is the type of the nodes in the graph, could be anything.
 * - neighbors and heuristic cost are provided by delegates.
 */
export function aStar<Node>({ start, goal, getNeighbors, heuristic }: AStarParams<Node>): Node[] {
  const openSet = new Set<Node>([start])
  const cameFrom = new Map<Node, Node>()
  const gScore = new Map<Node, number>()
  gScore.set(start, 0)
  const fScore = new Map<Node, number>()
  fScore.set(start, heuristic(start, goal))

  while (openSet.size > 0) {
    let current: Node | undefined = undefined
    let currentFScore = Infinity
    for (const node of openSet) {
      const score = fScore.get(node) ?? Infinity
      if (score < currentFScore) {
        current = node
        currentFScore = score
      }
    }
    if (!current) break

    if (current === goal) {
      return reconstructPath(cameFrom, current)
    }

    openSet.delete(current)
    for (const { node: neighbor, cost } of getNeighbors(current)) {
      const tentativeGScore = (gScore.get(current) ?? Infinity) + cost
      if (tentativeGScore < (gScore.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, current)
        gScore.set(neighbor, tentativeGScore)
        fScore.set(neighbor, tentativeGScore + heuristic(neighbor, goal))
        openSet.add(neighbor)
      }
    }
  }

  return [] // No path found
}

type Graph2Node = {
  getPosition(): Vector2Like
}

function reconstructPath<Node>(cameFrom: Map<Node, Node>, current: Node): Node[] {
  const path = [current]
  while (cameFrom.has(current)) {
    current = cameFrom.get(current)!
    path.push(current)
  }
  return path.reverse()
}

export function createGraph2<Node extends Graph2Node>(nodes: Iterable<Node>, {
  /**
   * The grid step used to determine if two nodes are neighbors (useless if `areNeighbors` is provided).
   * Default is 1.
   */
  gridStep = 1,
  /**
   * Delegate to determine if two nodes are neighbors.
   * By default, two nodes are neighbors if they are at most `gridStep` distance apart (manhattan distance).
   */
  areNeighbors = (a: Node, b: Node) => manhattanDistance2(a.getPosition(), b.getPosition()) <= gridStep + .0001,
  /**
   * Delegate to compute the cost of moving from node `a` to node `b`.
   * By default, it computes the euclidean distance between the two nodes.
   */
  heuristic = (a: Node, b: Node) => distance2(a.getPosition(), b.getPosition()),
} = {}) {
  type Link = {
    a: Node
    b: Node
    cost: number

  }
  const map = new Map<Node, Set<Link>>()
  const links = new Set<Link>()
  for (const node of nodes) {
    map.set(node, new Set())
  }

  const processed = new Set<Node>()
  for (const node of nodes) {
    for (const other of nodes) {
      if (node === other || processed.has(other))
        continue

      if (areNeighbors(node, other)) {
        const cost = heuristic(node, other)
        const link = { a: node, b: other, cost }
        map.get(node)!.add(link)
        map.get(other)!.add(link)
        links.add(link)
      }
    }
    processed.add(node)
  }

  function* getNeighbors(node: Node): Generator<{ node: Node, cost: number }> {
    const links = map.get(node)
    if (!links) return
    for (const { a, b, cost } of links) {
      yield a === node ? { node: b, cost } : { node: a, cost }
    }
  }

  return {
    map,
    get nodeCount() { return map.size },
    get linkCount() { return links.size },

    links: () => links.values(),

    getNeighbors,

    heuristic,

    findLink: (a: Node, b: Node) => {
      const links = map.get(a)
      if (!links) return
      for (const link of links) {
        if (link.a === b || link.b === b) {
          return link
        }
      }
    },

    findPath: (start: Node, goal: Node) => aStar({
      start,
      goal,
      getNeighbors,
      heuristic,
    }),

    pathIsValid: (path: Node[]) => {
      for (const [a, b] of pairwise(path)) {
        const links = map.get(a)
        if (!links)
          return false
        if (![...links].some(link => link.a === b || link.b === b))
          return false
      }
      return true
    }
  }
}
