const traversalMethods = ['depth-first', 'breadth-first'];
let nextId = 0;
export class Node {
    id = nextId++;
    parent = null;
    children = [];
    value;
    constructor(value) {
        this.value = value;
    }
    isRoot() {
        return this.parent === null;
    }
    isLeaf() {
        return this.children.length === 0;
    }
    ancestorCount() {
        let count = 0;
        let current = this.parent;
        while (current !== null) {
            count++;
            current = current.parent;
        }
        return count;
    }
    *ancestors() {
        let current = this.parent;
        while (current !== null) {
            yield current;
            current = current.parent;
        }
    }
    populate(...data) {
        const createChild = (entry) => {
            if (Array.isArray(entry)) {
                const [value, children] = entry;
                const node = new Node(value);
                node.parent = this;
                node.populate(...children);
                return node;
            }
            else {
                const node = new Node(entry);
                node.parent = this;
                return node;
            }
        };
        this.children = data.map(createChild);
        return this;
    }
    *traverse({ method = 'depth-first', skipSelf = false, } = {}) {
        const stack = skipSelf ? [...this.children] : [this];
        while (stack.length > 0) {
            const current = method === 'depth-first' ? stack.pop() : stack.shift();
            yield current;
            if (method === 'depth-first') {
                stack.push(...current.children);
            }
            else {
                stack.push(...current.children);
            }
        }
    }
    find(predicate, { traverseMethod: method = 'depth-first', skipSelf = false, } = {}) {
        for (const node of this.traverse({ method, skipSelf })) {
            if (predicate(node))
                return node;
        }
        return null;
    }
    *findAll(predicate, { traverseMethod: method = 'depth-first', skipSelf = false, } = {}) {
        for (const node of this.traverse({ method, skipSelf })) {
            if (predicate(node))
                yield node;
        }
    }
    followPath(nodePredicate, { skipSelf = true, } = {}) {
        const visit = (node, depth) => {
            const [ok, down] = nodePredicate(node, depth);
            if (ok)
                return node;
            if (!down)
                return null;
            for (const child of node.children) {
                const found = visit(child, depth + 1);
                if (found)
                    return found;
            }
            return null;
        };
        return skipSelf
            ? this.children.map(child => visit(child, 0)).find(Boolean) ?? null
            : visit(this, 0);
    }
}
