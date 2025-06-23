import { Node, NodeType } from './timeline'

export function compute(root: Node) {
  const wrappers = [] as Node[]
  const wrapperSizes = new Map<Node, number>()
  const relatives = [] as Node[]

  const queue = [root]
  while (queue.length > 0) {
    const node = queue.shift()!

    if (node.type === NodeType.wrapper) {
      wrapperSizes.set(node, 0)
      wrappers.push(node)
    } else if (node.type === NodeType.relative) {
      relatives.push(node)
    }

    queue.push(...node.children) // breadth-first traversal
  }

  // Compute wrapper sizes from the bottom up
  for (let i = wrappers.length - 1; i >= 0; i--) {
    const wrapper = wrappers[i]
    const nonRelativeChildren = wrapper.children.filter(child => child.type !== NodeType.relative)
    const jmax = nonRelativeChildren.length
    let length = jmax > 0 ? nonRelativeChildren[0].length : 0 // first child: offset is ignored
    for (let j = 1; j < jmax; j++) {
      const child = nonRelativeChildren[j]
      length += child.offset + child.length
    }
    wrapperSizes.set(wrapper, length)
    wrapper.length = length
  }

  queue.push(root)
  while (queue.length > 0) {
    const node = queue.shift()!

    if (node.type === NodeType.relative) {
      // Later
    } else {
      let start = 0
      for (const child of node.children) {
        start += child.offset
        child.start = start
        child.end = start + child.length
        start = child.end
      }

      if (node.type === NodeType.wrapper) {
      }
    }

    queue.unshift(...node.children) // depth-first traversal
  }

  if (root.type === NodeType.wrapper) {
    root.start = 0
    root.end = root.length
  }
}
