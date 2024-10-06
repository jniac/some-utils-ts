export enum ScalarType {
  Absolute = 1 << 0,
  Relative = 1 << 1,
  OppositeRelative = 1 << 2,
  SmallerRelative = 1 << 3,
  LargerRelative = 1 << 4,
  Fraction = 1 << 5,
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
}

const allScalarExtensions = { ...scalarExtensions, ...scalarExtraExtensions }

type ScalarExtension = keyof typeof allScalarExtensions

export type ScalarDeclaration = number | `${number}${ScalarExtension}`

const scalarExtensionsReverse: Record<ScalarType, ScalarExtension> = Object.fromEntries(
  Object.entries(allScalarExtensions).map(([k, v]) => [v, k] as [ScalarType, ScalarExtension])) as any

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
      case ScalarType.Fraction:
        return parentValue // "Part" space is always parent's size on normal axis (on colinear axis it is not computed here)
    }
  }

  parse(arg: ScalarDeclaration): boolean {
    if (typeof arg === 'number') {
      this.value = arg
      this.type = ScalarType.Absolute
      return true
    }

    if (typeof arg !== 'string') {
      console.log(`received:`, arg)
      throw new Error('Invalid scalar declaration')
    }

    const m = arg.match(/([\d\.]+)([a-z]+)$/)!
    if (!m) return false
    const [_, v, t] = m
    const value = Number.parseFloat(v)
    const type = allScalarExtensions[t as ScalarExtension]
    if (Number.isNaN(value) || type === undefined) return false
    this.value = value
    this.type = type
    return true
  }

  toString(): string {
    return `${this.value}${scalarExtensionsReverse[this.type]}`
  }
}
