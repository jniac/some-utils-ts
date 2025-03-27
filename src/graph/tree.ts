
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

  get(...indexes: number[]): Node<T> | null {
    let current: Node<T> | null = this
    for (const index of indexes) {
      if (current === null || index < 0 || index >= current.children.length) {
        return null
      }
      current = current.children[index]
    }
    return current
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
      const current = stack.shift()!
      yield current
      if (method === 'depth-first') {
        stack.unshift(...current.children)
      } else {
        stack.push(...current.children)
      }
    }
  }

  static findOptionDefaults = {
    method: 'depth-first' as TraversalMethod,
    skipSelf: false,
  }

  find(predicate: (node: Node<T>) => boolean): Node<T> | null
  find(options: Partial<typeof Node.findOptionDefaults>, predicate: (node: Node<T>) => boolean): Node<T> | null
  find(...args: any[]): Node<T> | null {
    const predicate = args.at(-1)
    const { method, skipSelf } = { ...Node.findOptionDefaults, ...args.at(-2) }
    for (const node of this.traverse({ method, skipSelf })) {
      if (predicate(node)) return node
    }
    return null
  };

  findAll(predicate: (node: Node<T>) => boolean): Generator<Node<T>, void, unknown>
  findAll(options: Partial<typeof Node.findOptionDefaults>, predicate: (node: Node<T>) => boolean): Generator<Node<T>, void, unknown>
  *findAll(...args: any[]): Generator<Node<T>, void, unknown> {
    const predicate = args.at(-1)
    const { method, skipSelf } = { ...Node.findOptionDefaults, ...args.at(-2) }
    for (const node of this.traverse({ method, skipSelf })) {
      if (predicate(node))
        yield node
    }
  }

  down(predicate: (node: Node<T>, depth: number) => [end: boolean, down: boolean]): Node<T> | null
  down(options: Partial<{ skipSelf: boolean }>, predicate: (node: Node<T>, depth: number) => [end: boolean, down: boolean]): Node<T> | null
  down(...args: any[]): Node<T> | null {
    const predicate = args.at(-1)
    const { skipSelf } = { skipSelf: false, ...args.at(-2) }
    const visit = (node: Node<T>, depth: number): Node<T> | null => {
      const [ok, down] = predicate(node, depth)
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

  add(...nodes: Node<T>[]) {
    for (const node of nodes) {
      node.parent = this
      this.children.push(node)
    }
    return this
  }

  addTo(parent: Node<T> | null) {
    if (parent) {
      parent.add(this)
    } else {
      this.removeFromParent()
    }
    return this
  }

  removeFromParent() {
    if (this.parent) {
      this.parent.children = this.parent.children.filter(child => child !== this)
      this.parent = null
    }
    return this
  }

  remove(...nodes: Node<T>[]) {
    for (const node of nodes) {
      if (node.parent === this) {
        node.removeFromParent()
      }
    }
    return this
  }
}
