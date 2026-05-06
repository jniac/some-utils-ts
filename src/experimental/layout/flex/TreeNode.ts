class TreeNodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TreeNodeError'
  }
}

export class TreeNode {
  static nextUid = 0

  /**
   * TreeNode UID, unique across multiple layout computations.
   */
  uid = TreeNode.nextUid++

  /**
   * TreeNode "Tree ID", unique within tree, assigned by computeTid() method. Used for serialization, visualization or debugging and purposes.
   * 
   * Notes:
   * - The tid is very volatile and may change between different runs. It should be used in single run.
   */
  tid = -1

  parent: this | null = null
  children: this[] = []

  /**
   * Shallow clone the node, without copying its children or parent.
   * 
   * Notes:
   * - This method allows the deepClone() method to create a new tree with the same structure and properties, but with different node instances.
   * - ⚠️ Must be overridden by subclasses to copy the properties of the subclass. The default implementation only creates a new instance of the same class, without copying any properties.
   */
  clone(): this {
    const ctor = this.constructor as new () => this
    const clone = new ctor()
    return clone
  }

  /**
   * Create a deep clone of the node and its entire subtree.
   * 
   * Notes:
   * - ⚠️ This method relies on the clone() method, so it must be properly implemented in subclasses to ensure that all properties are copied correctly.
   */
  deepClone(): this {
    const clone = this.clone()
    for (const child of this.children) {
      const childClone = child.deepClone()
      clone.addChild(childClone)
    }
    return clone
  }

  equals(other: this): boolean {
    return true
  }

  deepEquals(other: this, compare?: (A: this, B: this) => boolean): boolean {
    const equals = compare?.(this, other) ?? this.equals(other)
    if (equals === false) {
      return false
    }
    if (this.children.length !== other.children.length) {
      return false
    }
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].deepEquals(other.children[i], compare) === false) {
        return false
      }
    }
    return true
  }

  computeTid() {
    let tid = 0
    for (const node of this.allDescendants({ includeSelf: true })) {
      node.tid = tid++
    }
  }

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
        throw new TreeNodeError('Invalid state: node is not a child of its parent')
      path.push(index)
      node = parent
    }
    return path.reverse()
  }

  pathEquals(path: number[]): boolean {
    const currentPath = this.path()
    if (currentPath.length !== path.length) {
      return false
    }
    for (let i = 0; i < path.length; i++) {
      if (currentPath[i] !== path[i]) {
        return false
      }
    }
    return true
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

  removeChild(child: this): this {
    const index = this.children.indexOf(child)
    if (index === -1) {
      throw new TreeNodeError('Invalid state: node is not a child of this')
    }
    this.children.splice(index, 1)
    child.parent = null
    return this
  }

  removeAllChildren(): this {
    for (const child of this.children) {
      child.parent = null
    }
    this.children = []
    return this
  }

  removeFromParent(): this {
    this.parent?.removeChild(this)
    return this
  }

  addChild(child: TreeNode): this {
    child.removeFromParent()
    this.children.push(child as this)
    child.parent = this
    return this
  }

  addChildren(...children: TreeNode[]): this {
    for (const child of children) {
      this.addChild(child as this)
    }
    return this
  }

  prependChild(child: TreeNode): this {
    child.removeFromParent()
    this.children.unshift(child as this)
    child.parent = this
    return this
  }

  insertChildAt(index: number, child: TreeNode): this {
    child.removeFromParent()
    if (index < 0) {
      index = this.children.length + index + 1
    }
    this.children.splice(index, 0, child as this)
    child.parent = this
    return this
  }

  insertChildAfter(reference: TreeNode, child: TreeNode): this {
    const index = this.children.indexOf(reference as this)
    if (index === -1) {
      throw new TreeNodeError('Invalid state: reference node is not a child of this')
    }
    return this.insertChildAt(index + 1, child as this)
  }

  addTo(parent: TreeNode): this {
    parent.addChild(this)
    return this
  }

  prependTo(parent: TreeNode): this {
    parent.prependChild(this)
    return this
  }

  insertTo(parent: TreeNode, index: number): this {
    parent.insertChildAt(index, this)
    return this
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

  *flat(): Generator<this> {
    return yield* this.allDescendants({ includeSelf: true })
  }

  *allAncestors({ includeSelf = false } = {}): Generator<this> {
    let node: this | null = includeSelf ? this : this.parent
    while (node) {
      yield node
      node = node.parent
    }
  }

  nodeCount(): number {
    let count = 0
    for (const _ of this.allDescendants({ includeSelf: true })) {
      count++
    }
    return count
  }

  leavesCount(): number {
    let count = 0
    for (const _ of this.allLeaves()) {
      count++
    }
    return count
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

  findByUid(uid: number): this | null {
    return this.find(node => node.uid === uid, { includeSelf: true })
  }

  *findAll(predicate: (node: this) => boolean, { includeSelf = true } = {}): Generator<this> {
    for (const space of this.allDescendants({ includeSelf })) {
      if (predicate(space)) {
        yield space
      }
    }
  }

  forEachDescendant(callback: (node: this) => void, { includeSelf = true } = {}): this {
    for (const space of this.allDescendants({ includeSelf })) {
      callback(space)
    }
    return this
  }

  static readonly SERIALIZATION_NODE_HEADER_BYTE_LENGTH = 4 // parent tid (uint32)

  /**
   * A method to serialize the tree into a binary format, for efficient storage or transmission.
   * 
   * The serialization format is as follows:
   * - Each node is serialized in a breadth-first order, starting from the root.
   * - For each node, we write a fixed-size header containing the parent node's tid (4 bytes, uint32), followed by the node's extra data (if any).
   * 
   * Notes:
   * - Works well in conjunction with the deserializeFromBuffer() method.
   */
  serializeToBuffer({
    nodeExtraDataByteLength = 0,
    writeNodeExtraData = <(node: any, view: DataView, offset: number) => void>(() => { }),
  }): ArrayBuffer {
    const { SERIALIZATION_NODE_HEADER_BYTE_LENGTH: head } = TreeNode
    const nodes = [...this.allDescendants({ includeSelf: true })]
    const stride = head + nodeExtraDataByteLength
    const buffer = new ArrayBuffer(nodes.length * stride)
    const view = new DataView(buffer)

    const root = nodes[0]
    root.tid = 0
    view.setUint32(0, 0, true) // root has no parent, so we can set its parent tid to 0 or any value
    writeNodeExtraData(root, view, head)

    for (let i = 1; i < nodes.length; i++) {
      const node = nodes[i]
      node.tid = i
      const offset = i * stride
      view.setUint32(offset, node.parent!.tid, true)
      writeNodeExtraData(node, view, offset + head)
    }

    return buffer
  }

  /**
   * A method to deserialize the tree from a binary format, previously serialized using serializeToBuffer().
   * 
   * Notes:
   * - ⚠️ The methode mutates deeply the current tree: it removes any existing child and creates brand new nodes (from clone()) then parent them according to the serialized structure.
   */
  deserializeFromBuffer(buffer: ArrayBuffer, {
    nodeExtraDataByteLength = 0,
    readNodeExtraData = <(node: any, view: DataView, offset: number) => void>(() => { }),
  }): this {
    const { SERIALIZATION_NODE_HEADER_BYTE_LENGTH: head } = TreeNode
    const stride = head + nodeExtraDataByteLength
    const dataView = new DataView(buffer)
    const nodeCount = buffer.byteLength / stride
    const nodeMap = new Map<number, this>()

    this.removeAllChildren()

    const rootId = dataView.getUint32(0, true)
    nodeMap.set(rootId, this)

    readNodeExtraData(this, dataView, head)

    for (let i = 1; i < nodeCount; i++) {
      const offset = i * stride

      const parentId = dataView.getUint32(offset, true)

      const node = this.clone()
      nodeMap.set(i, node)

      const parent = nodeMap.get(parentId)
      if (!parent)
        throw new Error(`Space with parentId ${parentId} not found during deserialization`)
      parent.addChild(node)

      readNodeExtraData(node, dataView, offset + head)
    }

    nodeMap.clear()

    return this
  }

  toString(mode = <'uid' | 'path'>'uid'): string {
    switch (mode) {
      case 'uid':
        return `N.${this.uid}`
      case 'path':
        return `N(${this.path().join('.') || 'root'})`
    }
  }

  toTreeString({
    log = false,
    path = false,
    nodeToString = (node: this) => node.toString(path ? 'path' : 'uid'),
    afterNode = <null | ((node: this) => string)>null,
    indentCount = 3,
  } = {}): string {
    const lines = <string[]>[]
    let total = 0
    const indentUnit = ' '.repeat(Math.max(0, indentCount - 1))
    for (const n of this.allDescendants({ includeSelf: true })) {
      const indent = [...n.allAncestors()]
        .map(parentItem => {
          return (parentItem.parent === null || parentItem.isLastChild() ? ' ' : '│') + indentUnit
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
    const str = lines.join('\n')
    if (log) {
      console.log(str)
    }
    return str
  }
}
