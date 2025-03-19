import { pairwise } from '../iteration/utils'
import { distance2, manhattanDistance2 } from '../math/geom/geom2'
import { Vector2Like } from '../types'

type AStarHookInfo<Node> = {
  neighbor: Node
  start: Node
  goal: Node
  wayback: (count?: number) => Generator<Node>
}

type AStarParams<Node> = {
  start: Node
  goal: Node
  getNeighbors: (node: Node) => Iterable<{ node: Node, cost: number }>
  heuristic: (node: Node, goal: Node) => number

  /**
   * Custom hook to compute the heuristic cost of a neighbor.
   * If provided, this hook will be called for each neighbor of the current node,
   * and the result will be used instead of the default heuristic cost.
   */
  customNeighborHeuristic?: (info: AStarHookInfo<Node>) => number
}

/**
 * Definitively generic A* pathfinding algorithm:
 * - `Node` is the type of the nodes in the graph, could be anything.
 * - neighbors and heuristic cost are provided by delegates.
 */
export function aStar<Node>(params: AStarParams<Node>): Node[] {
  const { start, goal, getNeighbors, heuristic, customNeighborHeuristic } = params
  const openSet = new Set<Node>([start])
  const cameFrom = new Map<Node, Node>()

  /**
   * gScore = cost of the cheapest path from start to node
   */
  const gScore = new Map<Node, number>()
  gScore.set(start, 0)

  let current = start, neighbor = start
  const info: AStarHookInfo<Node> = {
    start,
    goal,
    get neighbor() { return neighbor },
    wayback: (count = Infinity) => wayback(current, cameFrom, count),
  }

  /**
   * fScore = gScore + heuristic
   */
  const fScore = new Map<Node, number>()
  fScore.set(start, heuristic(start, goal))

  while (openSet.size > 0) {
    let lowest: Node | undefined = undefined
    let currentFScore = Infinity

    // Find the node in openSet having the lowest fScore
    for (const node of openSet) {
      const score = fScore.get(node) ?? Infinity
      if (score < currentFScore) {
        lowest = node
        currentFScore = score
      }
    }

    if (!lowest)
      break

    current = lowest

    if (current === goal)
      return reconstructPath(cameFrom, current)

    openSet.delete(current)
    for (const { node, cost: defaultCost } of getNeighbors(current)) {
      neighbor = node

      // If a custom heuristic is provided, use it to compute the cost of moving to the neighbor
      const cost = customNeighborHeuristic?.(info) ?? defaultCost

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

function* wayback<Node>(current: Node, cameFrom: Map<Node, Node>, countMax = Infinity): Generator<Node> {
  let count = 0
  while (count++ < countMax) {
    yield current
    const next = cameFrom.get(current)
    if (next === undefined)
      break
    current = next
    if (count > 1000) {
      console.log(count)
      throw new Error('Infinite loop?')
    }
  }
}

function reconstructPath<Node>(cameFrom: Map<Node, Node>, current: Node): Node[] {
  return [...wayback(current, cameFrom)].reverse()
}

export class AStar<Node> implements AStarHookInfo<Node> {
  openSet = new Set<Node>()
  cameFrom = new Map<Node, Node>()
  gScore = new Map<Node, number>()
  fScore = new Map<Node, number>()

  params: AStarParams<Node>

  start: Node
  goal: Node
  current: Node
  neighbor: Node
  wayback: (count?: number) => Generator<Node, any, any>

  constructor(params: AStarParams<Node>) {
    this.params = params

    const { start, goal, heuristic } = params
    this.current = start
    this.neighbor = start
    this.openSet.add(start)
    this.gScore.set(start, 0)
    this.fScore.set(start, heuristic(start, goal))

    this.start = start
    this.goal = goal
    this.wayback = (count = Infinity) => wayback(this.current, this.cameFrom, count)
  }

  next(): Node[] | null {
    if (this.openSet.size === 0) return null

    let lowest: Node | undefined = undefined
    let currentFScore = Infinity

    for (const node of this.openSet) {
      const score = this.fScore.get(node) ?? Infinity
      if (score < currentFScore) {
        lowest = node
        currentFScore = score
      }
    }

    if (!lowest) return null
    this.current = lowest

    if (this.current === this.params.goal) {
      return reconstructPath(this.cameFrom, this.current)
    }

    this.openSet.delete(this.current)
    for (const { node, cost: defaultCost } of this.params.getNeighbors(this.current)) {
      this.neighbor = node
      const cost = this.params.customNeighborHeuristic?.(this) ?? defaultCost
      const tentativeGScore = (this.gScore.get(this.current) ?? Infinity) + cost

      if (tentativeGScore < (this.gScore.get(this.neighbor) ?? Infinity)) {
        this.cameFrom.set(this.neighbor, this.current)
        this.gScore.set(this.neighbor, tentativeGScore)
        this.fScore.set(this.neighbor, tentativeGScore + this.params.heuristic(this.neighbor, this.params.goal))
        this.openSet.add(this.neighbor)
      }
    }
    return null
  }

  solve(): Node[] {
    const { openSet } = this
    while (openSet.size > 0) {
      const path = this.next()
      if (path)
        return path
    }
    return []
  }
}


type Link<Node> = {
  a: Node
  b: Node
  costAB: number
  costBA: number
}

type Graph<Node> = {
  nodes(): Iterable<Node>
  links(): Iterable<Link<Node>>
  getNeighbors: (node: Node) => Iterable<{ node: Node, cost: number }>
  heuristic: (a: Node, b: Node) => number
  findPath(start: Node, goal: Node): Node[]
  pathIsValid(path: Node[]): boolean
}

export class Graph2<Node extends Vector2Like> implements Graph<Node> {
  #map = new Map<Node, Set<Link<Node>>>()
  #links = new Set<Link<Node>>()

  nodes = () => this.#map.keys()
  links = () => this.#links.values()

  heuristic: (a: Node, b: Node) => number
  getNeighbors: (node: Node) => Iterable<{ node: Node; cost: number }>

  constructor(nodes: Iterable<Node>, {
    /**
     * Delegate to compute the cost of moving from node `a` to node `b`.
     * By default, it computes the euclidean distance between the two nodes.
     * 
     * NOTE: The heuristic will be called twice for each link, once for `a` to `b`
     * and once for `b` to `a`. Results may differ if the heuristic is not symmetric.
     */
    heuristic = (a: Node, b: Node) => distance2(a, b),
  } = {}) {
    const map = this.#map
    for (const node of nodes) {
      map.set(node, new Set())
    }

    this.heuristic = heuristic

    // To implement the Graph interface, getNeighbors must be binded to this instance
    this.getNeighbors = function* (node: Node): Generator<{ node: Node, cost: number }> {
      const links = map.get(node)
      if (!links)
        return
      for (const { a, b, costAB, costBA } of links) {
        yield a === node
          ? { node: b, cost: costAB }
          : { node: a, cost: costBA }
      }
    }
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
    areNeighbors = (a: Node, b: Node) => manhattanDistance2(a, b) <= gridStep + .0001,
  } = {}) {
    const map = this.#map
    const links = this.#links
    const { heuristic } = this

    for (const node of map.keys()) {
      map.get(node)!.clear()
    }

    const processed = new Set<Node>()
    for (const node of map.keys()) {
      for (const other of map.keys()) {
        if (node === other || processed.has(other))
          continue

        if (areNeighbors(node, other)) {
          const a = node
          const b = other
          const costAB = heuristic(a, b)
          const costBA = heuristic(b, a)
          const link = { a, b, costAB, costBA }
          map.get(a)!.add(link)
          map.get(b)!.add(link)
          links.add(link)
        }
      }
      processed.add(node)
    }

    return this
  }

  findLink(a: Node, b: Node) {
    const links = this.#map.get(a)
    if (!links)
      return null
    for (const link of links) {
      if (link.a === b || link.b === b)
        return link
    }
  }

  findPath(start: Node, goal: Node, customNeighborHeuristic?: (info: AStarHookInfo<Node>) => number): Node[] {
    const { getNeighbors, heuristic } = this
    const astar = new AStar({
      start,
      goal,
      getNeighbors,
      heuristic,
      customNeighborHeuristic,
    })
    return astar.solve()
  }

  pathIsValid(path: Node[]): boolean {
    for (const [a, b] of pairwise(path)) {
      const links = this.#map.get(a)
      if (!links)
        return false
      if (![...links].some(link => link.a === b || link.b === b))
        return false
    }
    return true
  }
}
