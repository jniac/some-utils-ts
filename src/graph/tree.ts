
type RecursiveStructure<T> = T | [T, RecursiveStructure<T>[]]

const traversalMethods = ['depth-first', 'breadth-first'] as const
type TraversalMethod = typeof traversalMethods[number]

let nextId = 0
export class Node<T> {
  readonly id = nextId++

  parent: Node<T> | null = null
  children: Node<T>[] = []
  value: T

  constructor(value: T) {
    this.value = value
  }

  isRoot(): boolean {
    return this.parent === null
  }

  isLeaf(): boolean {
    return this.children.length === 0
  }

  ancestorCount() {
    let count = 0
    let current = this.parent
    while (current !== null) {
      count++
      current = current.parent
    }
    return count
  }

  *ancestors() {
    let current = this.parent
    while (current !== null) {
      yield current
      current = current.parent
    }
  }

  populate(...data: RecursiveStructure<T>[]) {
    const createChild = (entry: RecursiveStructure<T>): Node<T> => {
      if (Array.isArray(entry)) {
        const [value, children] = entry
        const node = new Node(value)
        node.parent = this
        node.populate(...children)
        return node
      } else {
        const node = new Node(entry)
        node.parent = this
        return node
      }
    }

    this.children = data.map(createChild)
    return this
  }

  *traverse({
    method = 'depth-first' as TraversalMethod,
    skipSelf = false,
  } = {}): Generator<Node<T>, void, unknown> {
    const stack: Node<T>[] = skipSelf ? [...this.children] : [this]
    while (stack.length > 0) {
      const current = method === 'depth-first' ? stack.pop()! : stack.shift()!
      yield current
      if (method === 'depth-first') {
        stack.push(...current.children)
      } else {
        stack.push(...current.children)
      }
    }
  }

  find(predicate: (node: Node<T>) => boolean, {
    traverseMethod: method = 'depth-first' as TraversalMethod,
    skipSelf = false,
  } = {}): Node<T> | null {
    for (const node of this.traverse({ method, skipSelf })) {
      if (predicate(node)) return node
    }
    return null
  }

  *findAll(predicate: (node: Node<T>) => boolean, {
    traverseMethod: method = 'depth-first' as TraversalMethod,
    skipSelf = false,
  } = {}): Generator<Node<T>, void, unknown> {
    for (const node of this.traverse({ method, skipSelf })) {
      if (predicate(node))
        yield node
    }
  }

  followPath(nodePredicate: (node: Node<T>, depth: number) => [end: boolean, down: boolean], {
    skipSelf = true,
  } = {}): Node<T> | null {
    const visit = (node: Node<T>, depth: number): Node<T> | null => {
      const [ok, down] = nodePredicate(node, depth)
      if (ok)
        return node
      if (!down)
        return null

      for (const child of node.children) {
        const found = visit(child, depth + 1)
        if (found)
          return found
      }

      return null
    }

    return skipSelf
      ? this.children.map(child => visit(child, 0)).find(Boolean) ?? null
      : visit(this, 0)
  }
}
