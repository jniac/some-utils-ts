export class TreeNode {
  static nextUid = 0

  /**
   * LayoutNode UID, unique across multiple layout computations.
   */
  uid = TreeNode.nextUid++

  parent: this | null = null
  children: this[] = []

  isRoot(): boolean {
    return this.parent === null
  }

  isLeaf(): boolean {
    return this.children.length === 0
  }

  root(): this {
    let node: this = this
    while (node.parent) {
      node = node.parent
    }
    return node
  }

  depth(): number {
    let d = 0
    let p = this.parent
    while (p !== null) {
      d++
      p = p.parent
    }
    return d
  }

  path(): number[] {
    const path = [] as number[]
    let node: this = this
    while (node.parent !== null) {
      const parent = node.parent
      const index = parent.children.indexOf(node)
      if (index === -1)
        throw new Error('this is not a child of its parent.')
      path.push(index)
      node = parent
    }
    return path.reverse()
  }

  /**
   * Return the space at the given path.
   * 
   * Negative indexes are allowed.
   */
  childAt(...path: number[]): this | null
  childAt(path: Iterable<number>): this | null
  childAt(...args: any[]): this | null {
    const path = (args[0] && typeof args[0] === 'object' && Symbol.iterator in args[0]) ? args[0] : args
    let current: this = this
    for (let index of path) {
      if (index < 0) {
        index = current.children.length + index
      }
      current = current.children[index]
      if (!current) {
        return null
      }
    }
    return current
  }

  *flattened(): Generator<this> {
    yield this
    for (const child of this.children) {
      yield* child.flattened()
    }
  }

  *allLeaves(): Generator<this> {
    if (this.children.length === 0) {
      yield this
    } else {
      for (const child of this.children) {
        yield* child.allLeaves()
      }
    }
  }

  *allDescendants({ includeSelf = false } = {}): Generator<this> {
    if (includeSelf)
      yield this
    for (const child of this.children) {
      yield* child.allDescendants({ includeSelf: true })
    }
  }

  *allAncestors(): Generator<this> {
    let node: this | null = this.parent
    while (node) {
      yield node
      node = node.parent
    }
  }

  firstLeaf(): this {
    let node: this = this
    while (node.children.length > 0) {
      node = node.children[0]
    }
    return node
  }

  lastLeaf(): this {
    let node: this = this
    while (node.children.length > 0) {
      node = node.children[node.children.length - 1]
    }
    return node
  }

  hasChild(): boolean {
    return this.children.length > 0
  }

  isFirstChild(): boolean {
    if (this.parent === null)
      return true
    const siblings = this.parent.children
    return siblings[0] === this
  }

  isLastChild(): boolean {
    if (this.parent === null)
      return true
    const siblings = this.parent.children
    return siblings[siblings.length - 1] === this
  }

  find(predicate: (node: this) => boolean, { includeSelf = true } = {}): this | null {
    for (const space of this.allDescendants({ includeSelf })) {
      if (predicate(space)) {
        return space
      }
    }
    return null
  }

  *findAll(predicate: (node: this) => boolean, { includeSelf = true } = {}): Generator<this> {
    for (const space of this.allDescendants({ includeSelf })) {
      if (predicate(space)) {
        yield space
      }
    }
  }

  toTreeString({
    nodeToString = (node: this) => node.toString(),
    afterNode = <null | ((node: this) => string)>null,
  } = {}): string {
    const lines = <string[]>[]
    let total = 0
    for (const n of this.allDescendants({ includeSelf: true })) {
      const indent = [...n.allAncestors()]
        .map(parentItem => {
          return parentItem.parent === null || parentItem.isLastChild() ? '   ' : '│  '
        })
        .reverse()
        .join('')
      const relation = n.depth() === 0 ? '->' :
        n.isLastChild() === false ? '├─' : '└─'
      const line = `${indent}${relation} ${nodeToString(n)}`
      lines.push(line)

      if (afterNode) {
        const after = afterNode(n)
        if (after) {
          const afterIndent =
            indent
            + (n.isLastChild() ? '   ' : '│  ')
            + (n.hasChild() ? '│' : ' ')
          const afterLines = after.split('\n')
          if (afterLines.length > 0) {
            lines.push(afterIndent + '  ╷')
            const last = afterLines.pop()!
            for (const line of afterLines) {
              lines.push(afterIndent + '  ├─ ' + line)
            }
            lines.push(afterIndent + '  └─ ' + last)
            lines.push(afterIndent)
          }
        }
      }

      total++
    }
    lines.unshift(`Tree: (${total})`)
    return lines.join('\n')
  }
}
