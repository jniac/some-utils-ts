type OverlapKeys<T, U> = keyof T & keyof U
type NoOverlap<T, U> = OverlapKeys<T, U> extends never ? true : never
type Merge<T, U> = NoOverlap<T, U> extends true ? T & U : never

export function mergePrototypes<AType, BType>(
  ClassA: new () => AType,
  ClassB: new () => BType
): new () => Merge<AType, BType> {
  const aProto = ClassA.prototype
  const bProto = ClassB.prototype

  // Check for conflicts:
  const commonKeys = Object.getOwnPropertyNames(aProto)
    .filter((key) =>
      key !== "constructor" &&
      bProto.hasOwnProperty(key))

  if (commonKeys.length > 0) {
    throw new Error(`Conflicting members found: ${commonKeys.join(", ")}`)
  }

  class C {
    constructor() {
      Object.assign(this, new ClassA())
      Object.assign(this, new ClassB())
    }
  }

  const cProto = C.prototype as any
  for (const proto of [aProto, bProto]) {
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
      cProto[key] = aProto[key]
      Object.defineProperty(cProto, key, descriptor)
    }
  }

  return C as any
}
