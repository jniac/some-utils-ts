export type DestroyableObject<V = any> = {
    destroy: () => void;
    value?: V;
};
export type Destroyable = DestroyableObject | (() => void);
export type StringMatcher = '*' | string | RegExp | ((str: string) => boolean);
/**
 * @deprecated Use `StringMatcher` instead.
 */
export type StringFilter = StringMatcher;
export type OneOrMany<T> = T | T[];
/**
 * Makes all properties of an object type mutable. Reverse of `Readonly<T>`.
 */
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
/**
 * @deprecated Use `Mutable` instead.
 */
export type Editable<T> = Mutable<T>;
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
/**
 * Returns the keys of an object type that are mutable.
 *
 * Kind of tricky to understand, but it works.
 */
export type MutableKeys<T> = {
    [K in keyof T]-?: IfEquals<{
        [Q in K]: T[K];
    }, {
        -readonly [Q in K]: T[K];
    }, K, never>;
}[keyof T];
type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B;
export type Vector2Like = {
    x: number;
    y: number;
};
/**
 * @deprecated Use `Point2Like` instead.
 */
export type PointLike = Vector2Like;
export type Point2Like = Vector2Like;
export type Vector3Like = {
    x: number;
    y: number;
    z: number;
};
export type Point3Like = Vector3Like;
export type RectangleLike = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export type Ray2Like = {
    origin: Vector2Like;
    direction: Vector2Like;
};
export {};
