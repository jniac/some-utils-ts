type RecursiveStructure<T> = T | [T, RecursiveStructure<T>[]];
export declare class Node<T> {
    readonly id: number;
    parent: Node<T> | null;
    children: Node<T>[];
    value: T;
    constructor(value: T);
    isRoot(): boolean;
    isLeaf(): boolean;
    ancestorCount(): number;
    ancestors(): Generator<Node<T>, void, unknown>;
    get(...indexes: number[]): Node<T> | null;
    populate(...data: RecursiveStructure<T>[]): this;
    traverse({ method, skipSelf, }?: {
        method?: "depth-first" | "breadth-first" | undefined;
        skipSelf?: boolean | undefined;
    }): Generator<Node<T>, void, unknown>;
    find(predicate: (node: Node<T>) => boolean, { traverseMethod: method, skipSelf, }?: {
        traverseMethod?: "depth-first" | "breadth-first" | undefined;
        skipSelf?: boolean | undefined;
    }): Node<T> | null;
    findAll(predicate: (node: Node<T>) => boolean, { traverseMethod: method, skipSelf, }?: {
        traverseMethod?: "depth-first" | "breadth-first" | undefined;
        skipSelf?: boolean | undefined;
    }): Generator<Node<T>, void, unknown>;
    followPath(nodePredicate: (node: Node<T>, depth: number) => [end: boolean, down: boolean], { skipSelf, }?: {
        skipSelf?: boolean | undefined;
    }): Node<T> | null;
    add(...nodes: Node<T>[]): this;
    addTo(parent: Node<T> | null): this;
    removeFromParent(): this;
    remove(...nodes: Node<T>[]): this;
}
export {};
