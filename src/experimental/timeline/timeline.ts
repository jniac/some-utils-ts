import { compute } from './compute'

const nodeRelativeReferences = [
  'self',
  'parent',
  'next',
  'prev',
  'first',
  'last',
] as const

type NodeRelativeReference = typeof nodeRelativeReferences[number]

export enum NodeType {
  absolute,
  block,
  relative,
  wrapper,
}

type NodeTypeLiteral = `${keyof typeof NodeType}`
type NodeTypeDeclaration = NodeType | NodeTypeLiteral
function solveNodeTypeDeclaration(
  type: NodeTypeDeclaration,
): NodeType {
  if (typeof type === 'string') {
    const value = NodeType[type]
    if (value !== undefined)
      return value
    throw new Error(`Invalid node type: ${type}`)
  }
  return type
}

const addDefaults = {
  absolute: {
    type: 'absolute' as const,
    start: 0,
    end: 0,
  },

  block: {
    offset: 0,
    length: 0,
  },

  relative: {
    ref: 'parent' as NodeRelativeReference,
    start: 0,
    end: 0,
  },

  wrapper: {
    offset: 0,
  },
}

const nodePropsDefaults = {
  name: '',
  type: <NodeTypeDeclaration>'block',
  offset: 0,
  length: 0,
}

type NodeProps = typeof nodePropsDefaults

let nextNodeId = 0
export class Node {
  readonly nodeId = nextNodeId++;

  name = ''
  type = NodeType.block
  offset = 0
  length = 0

  start = 0
  end = 0

  root: Node = this
  parent: Node | null = null
  children = [] as Node[]

  userData: any = null

  constructor(props?: Partial<NodeProps>) {
    if (props)
      this.set(props)
  }

  *ascendants({ includeSelf = true } = {}): Generator<Node> {
    if (includeSelf)
      yield this
    let node = this.parent
    while (node) {
      yield node
      node = node.parent
    }
  }

  *descendants({
    includeSelf = true,
    method = <'depth-first' | 'breadth-first'>'depth-first',
  } = {}): Generator<Node> {
    if (includeSelf)
      yield this

    const queue = includeSelf ? [this] : [...this.children]

    if (method === 'breadth-first') {
      while (queue.length > 0) {
        const node = queue.shift()!
        queue.push(...node.children)
        yield node
      }
    } else {
      while (queue.length > 0) {
        const node = queue.shift()!
        queue.unshift(...node.children)
        yield node
      }
    }
  }

  query(arg: string | RegExp | ((node: Node) => boolean), {
    includeSelf = false,
    method = <'depth-first' | 'breadth-first'>'depth-first',
  } = {}): Node | null {
    const predicate = typeof arg === 'function'
      ? arg
      : typeof arg === 'string'
        ? (node: Node) => node.name === arg
        : (node: Node) => node.name.match(arg)

    for (const node of this.descendants({ includeSelf, method }))
      if (predicate(node))
        return node

    return null
  }

  depth() {
    let depth = 0
    let node = this.parent
    while (node) {
      depth++
      node = node.parent
    }
    return depth
  }

  set(props: Partial<NodeProps>): this {
    Object.assign(this, props)
    return this
  }

  setUserData(data: Record<string, any>): this {
    this.userData ??= {}
    Object.assign(this.userData, data)
    return this
  }

  removeFromParent(): this {
    if (this.parent) {
      const index = this.parent.children.indexOf(this)
      if (index === -1) {
        console.log(this)
        console.log(this.parent)
        throw new Error('Node not found in parent children (???)')
      }
      this.parent.children.splice(index, 1)
      this.parent = null
    }
    return this
  }

  add(node: Node): this
  add(nodeArg: { name?: string } & { type?: 'block' } & Partial<typeof addDefaults.block>): this
  add(nodeArg: { name?: string } & { type: 'relative' } & Partial<typeof addDefaults.relative>): this
  add(nodeArg: { name?: string } & { type: 'wrapper' } & Partial<typeof addDefaults.wrapper>): this
  add(nodeArg: any): this {
    if (nodeArg instanceof Node) {
      nodeArg.removeFromParent()
      nodeArg.parent = this
      nodeArg.root = this.root
      this.children.push(nodeArg)
      return this
    }

    const node = new Node(nodeArg)
    return this.add(node)
  }
}

function drawToCanvas(ctx: CanvasRenderingContext2D, node: Node) {
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.transform(1, 0, 0, 1, 50, 50)

  let i = 0
  for (const child of node.descendants()) {
    ctx.fillStyle = ['black', 'red', 'blue', 'green'][i % 4]
    ctx.fillRect(child.start, child.depth() * 6, child.end - child.start, 4)
    i++
  }
}

type NodeIntersection = {
  ref: Node
  target: Node
  distance: number
  coverage: number
}

export class Timeline extends Node {
  static readonly Node = Node

  #parts = {
    heads: [new Node({ name: 'main-head' })],
  }

  get mainHead() {
    return this.#parts.heads[0]
  }

  constructor() {
    super({ name: 'timeline' })
    this.type = NodeType.wrapper
  }

  compute() {
    compute(this)
    return this
  }

  drawToCanvas(ctx: CanvasRenderingContext2D) {
    drawToCanvas(ctx, this)
    return this
  }
}
