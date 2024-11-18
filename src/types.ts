export type DestroyableObject<V = any> = { destroy: () => void, value?: V }
export type Destroyable = DestroyableObject | (() => void)

export type StringMatcher = '*' | string | RegExp | ((str: string) => boolean)

export type OneOrMany<T> = T | T[]

/**
 * Makes all properties of an object type mutable. Reverse of `Readonly<T>`.
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

/**
 * @deprecated Use `Mutable` instead.
 */
export type Editable<T> = Mutable<T>

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K]
}

/**
 * Returns the keys of an object type that are mutable.
 * 
 * Kind of tricky to understand, but it works.
 */
export type MutableKeys<T> = {
  [K in keyof T]-?: IfEquals<{ [Q in K]: T[K] }, { -readonly [Q in K]: T[K] }, K, never>
}[keyof T]

// Helper type
type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? A : B

/**
 * Returns a new object type with only the mutable properties of the original object type.
 */
export type MutableOnly<T> = Pick<T, MutableKeys<T>>



//----------------------------------------//
//                                        //
//              Math types                //
//                                        //
//----------------------------------------//

export type Vector2Like<T = number> = {
  x: T
  y: T
}

export type Point2Like = Vector2Like

export type Vector3Like<T = number> = {
  x: T
  y: T
  z: T
}

export type Point3Like = Vector3Like

export type Vector4Like<T = number> = {
  x: T
  y: T
  z: T
  w: T
}

export type Point4Like = Vector4Like

export type RectangleLike = {
  x: number
  y: number
  width: number
  height: number
}

export type Ray2Like = {
  origin: Vector2Like
  direction: Vector2Like
}

export type Color4Like = {
  r: number
  g: number
  b: number
  a: number
}