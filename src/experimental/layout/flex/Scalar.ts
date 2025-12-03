export enum ScalarType {
  Auto,
  Absolute,
  Relative,
  OppositeRelative,
  SmallerRelative,
  LargerRelative,
  Fraction,
}

const scalarExtensions = {
  'abs': ScalarType.Absolute,
  'rel': ScalarType.Relative,
  'opp': ScalarType.OppositeRelative,
  'sm': ScalarType.SmallerRelative,
  'lg': ScalarType.LargerRelative,
  'fr': ScalarType.Fraction,
}

const scalarExtraExtensions = {
  '%': ScalarType.Relative,
  'part': ScalarType.Fraction,
  /**
   * "sh" for "share".
   */
  'sh': ScalarType.Fraction,
}

const allScalarExtensions = { ...scalarExtensions, ...scalarExtraExtensions }

type ScalarExtension = keyof typeof allScalarExtensions

export type ScalarDeclaration =
  | 'auto'
  | number
  | `${number}`
  | `${number}${ScalarExtension}`

const scalarExtensionsReverse: Record<ScalarType, ScalarExtension> = Object.fromEntries(
  Object.entries(allScalarExtensions).map(([k, v]) => [v, k] as [ScalarType, ScalarExtension])) as any

export function parseScalar(arg: ScalarDeclaration, out = new Scalar()): Scalar {
  if (arg === 'auto') {
    out.value = 1
    out.type = ScalarType.Auto
    return out
  }

  if (typeof arg === 'number') {
    out.value = arg
    out.type = ScalarType.Absolute
    return out
  }

  if (typeof arg !== 'string') {
    console.log(`received:`, arg)
    throw new Error('Invalid scalar declaration')
  }

  const m = arg.match(/([\d\.]+)([a-z%]+)?$/)!
  if (!m) {
    console.log(`received:`, arg)
    throw new Error('Invalid scalar declaration')
  }

  const [_, v, t] = m
  let value = Number.parseFloat(v)
  const type = allScalarExtensions[t as ScalarExtension] ?? ScalarType.Absolute
  if (Number.isNaN(value)) {
    throw new Error('Invalid scalar declaration')
  }
  if (t === '%') {
    value /= 100
  }
  out.value = value
  out.type = type

  return out
}

export class Scalar {
  static parse(str: ScalarDeclaration, out = new Scalar()): Scalar {
    out.parse(str)
    return out
  }

  value: number
  type: ScalarType

  constructor(value: number = 0, mode: ScalarType = ScalarType.Absolute) {
    this.value = value
    this.type = mode
  }

  set(value: number, mode: ScalarType = this.type) {
    this.value = value
    this.type = mode
  }

  compute(parentValue: number, parentOppositeValue: number): number {
    switch (this.type) {
      case ScalarType.Absolute:
        return this.value
      case ScalarType.Relative:
        return this.value * parentValue
      case ScalarType.OppositeRelative:
        return this.value * parentOppositeValue
      case ScalarType.SmallerRelative:
        return this.value * Math.min(parentValue, parentOppositeValue)
      case ScalarType.LargerRelative:
        return this.value * Math.max(parentValue, parentOppositeValue)
      case ScalarType.Auto:
      case ScalarType.Fraction:
        return parentValue // "Part" space is always parent's size on normal axis (on colinear axis it is not computed here)
    }
  }

  parse(arg: any): this {
    parseScalar(arg, this)
    return this
  }

  toString(): string {
    return this.type === ScalarType.Auto
      ? 'auto'
      : `${this.value}${scalarExtensionsReverse[this.type]}`
  }
}
