type OverlapKeys<T, U> = keyof T & keyof U;
type NoOverlap<T, U> = OverlapKeys<T, U> extends never ? true : never;
type Merge<T, U> = NoOverlap<T, U> extends true ? T & U : never;
export declare function mergePrototypes<AType, BType>(ClassA: new () => AType, ClassB: new () => BType): new () => Merge<AType, BType>;
export {};
