
type ChildrenAccessor<T> = (node: T) => Iterable<T>
type ParentAccessor<T> = (node: T) => T | undefined
type FilterPredicate<T> = (node: T) => boolean

const commonOptionsDefaults = <T>() => ({
  /**
   * A function that returns true if the current node should be included in the result.
   * - By default, all nodes are included.
   * - If `false`, the node and all its ascendants or descendants will be excluded.
   *   - In ascendants, this will stop the traversal, useful for simulating partial rooted trees.
   *   - In descendants, this will stop the traversal, useful for pruning the tree.
   */
  filter: (() => true) as FilterPredicate<T>,

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
})

const allAscendantsOfOptionsDefaults = <T>() => ({
  ...commonOptionsDefaults<T>(),

  /**
   * A function that returns the parent of the node.
   */
  getParent: (node => (node as any).parent) as ParentAccessor<T>,
})

export function* allAscendantsOf<T>(firstNode: T, options: Partial<typeof allAscendantsOfOptionsDefaults> = {}): Generator<{ node: T }> {
  const {
    nodesMax,
    includeFirstNode,
    filter,
    getParent,
  } = { ...allAscendantsOfOptionsDefaults<T>(), ...options }
  let count = 0
  const visited = new Set<T>()
  const queue: T[] = includeFirstNode ? [firstNode] : []
  let current: T | undefined = firstNode

  while (current) {
    if (filter(current) === false) {
      break
    }

    if (visited.has(current)) {
      console.warn('Tree traversal visited the same node twice', current)
      break
    }
    visited.add(current)

    yield { node: current }
    count++

    if (count >= nodesMax) {
      break
    }

    current = getParent(current)
  }
}

export function computeDepth<T>(firstNode: T, options: Omit<Parameters<typeof allAscendantsOf>[1], 'includeFirstNode'>): number {
  let depth = 0
  for (const _ of allAscendantsOf(firstNode, { ...options, includeFirstNode: false })) {
    depth++
  }
  return depth
}

const allDescendantsOfOptionsDefaults = <T>() => ({
  ...commonOptionsDefaults<T>(),

  /**
   * A function that returns the children of the node.
   */
  getChildren: (node => (node as any).children) as ChildrenAccessor<T>,

  /**
   * The method to use for traversing the tree.
   * - `depth-first` will traverse the tree depth-first.
   * - `breadth-first` will traverse the tree breadth-first.
   */
  method: 'depth-first' as 'depth-first' | 'breadth-first',
})

export function* allDescendantsOf<T>(firstNode: T, options: Partial<typeof allDescendantsOfOptionsDefaults> = {}): Generator<{ node: T }> {
  const {
    nodesMax,
    includeFirstNode,
    method,
    filter,
    getChildren,
  } = { ...allDescendantsOfOptionsDefaults<T>(), ...options }

  let count = 0
  const queue: T[] = includeFirstNode ? [firstNode] : [...getChildren(firstNode)]
  const visited = new Set<T>()
  while (queue.length > 0) {
    const current = queue.shift()!

    if (filter(current) === false) {
      continue
    }

    yield { node: current }
    count++

    if (count >= nodesMax) {
      break
    }

    if (visited.has(current)) {
      console.warn('Tree traversal visited the same node twice', current)
      continue
    }

    visited.add(current)
    const children = getChildren(current)
    if (method === 'depth-first') {
      queue.unshift(...children)
    } else {
      queue.push(...children)
    }
  }
}
