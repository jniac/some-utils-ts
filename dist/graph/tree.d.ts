type RecursiveStructure<T> = T | [T, RecursiveStructure<T>[]];
declare const traversalMethods: readonly ["depth-first", "breadth-first"];
type TraversalMethod = typeof traversalMethods[number];
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
    static findOptionDefaults: {
        method: TraversalMethod;
        skipSelf: boolean;
    };
    find(predicate: (node: Node<T>) => boolean): Node<T> | null;
    find(options: Partial<typeof Node.findOptionDefaults>, predicate: (node: Node<T>) => boolean): Node<T> | null;
    findAll(predicate: (node: Node<T>) => boolean): Generator<Node<T>, void, unknown>;
    findAll(options: Partial<typeof Node.findOptionDefaults>, predicate: (node: Node<T>) => boolean): Generator<Node<T>, void, unknown>;
    down(predicate: (node: Node<T>, depth: number) => [end: boolean, down: boolean]): Node<T> | null;
    down(options: Partial<{
        skipSelf: boolean;
    }>, predicate: (node: Node<T>, depth: number) => [end: boolean, down: boolean]): Node<T> | null;
    add(...nodes: Node<T>[]): this;
    addTo(parent: Node<T> | null): this;
    removeFromParent(): this;
    remove(...nodes: Node<T>[]): this;
}
export {};
//# sourceMappingURL=tree.d.ts.map