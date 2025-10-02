import { fromTransitionDeclaration, TransitionDeclaration } from './transition'

export type FuzzyRangeType = {
  /**
   * The point where the range starts to fade in.
   */
  start0: number
  /**
   * The point where the range is fully "on".
   */
  start1: number
  /**
   * The point where the range starts to fade out.
   */
  end1: number
  /**
   * The point where the range is fully "off".
   */
  end0: number
}

export enum FuzzyRangePosition {
  Inside = 0,
  Before = 1 << 0,
  BeforeFade = 1 << 1 | Before,
  After = 1 << 2,
  AfterFade = 1 << 3 | After,
}

function isFuzzyRangeType(arg: any): arg is FuzzyRangeType {
  return arg && 'start0' in arg && 'start1' in arg && 'end1' in arg && 'end0' in arg
}

function computePosition(x: number, range: FuzzyRangeType): FuzzyRangePosition {
  const { start0: a, start1: b, end1: c, end0: d } = range
  if (x < a)
    return FuzzyRangePosition.BeforeFade
  if (x < b)
    return FuzzyRangePosition.Before
  if (x <= c)
    return FuzzyRangePosition.Inside
  if (x <= d)
    return FuzzyRangePosition.After
  return FuzzyRangePosition.AfterFade
}

function evaluate(
  x: number,
  range: FuzzyRangeType,
  ease?: TransitionDeclaration | [start: TransitionDeclaration, end: TransitionDeclaration],
): number {
  const { start0: a, start1: b, end1: c, end0: d } = range
  if (x <= a)
    return 0
  if (x >= d)
    return 0
  if (x >= b && x <= c)
    return 1

  const y = x < b
    ? (x - a) / (b - a)
    : (d - x) / (d - c)

  if (Array.isArray(ease)) {
    const [startEase, endEase] = ease
    return x < b
      ? fromTransitionDeclaration(startEase)(y)
      : fromTransitionDeclaration(endEase)(y)
  }

  return ease
    ? fromTransitionDeclaration(ease)(y)
    : y
}

export type FuzzyRangeDeclaration =
  | FuzzyRangeType
  | [start0: number, start1: number, end1: number, end0: number]
  | [start: number, end: number, outFadeLength: number]
  | { center: number, length: number, fade: number }
  | { center: number, length: number, outerLength: number }

const _dummy = {
  start0: 0,
  start1: 0,
  end1: 0,
  end0: 0,
}


export function fromFuzzyRangeDeclaration<T extends FuzzyRangeType>(range: FuzzyRangeDeclaration, out?: T): FuzzyRangeType {
  out ??= _dummy as T

  if (Array.isArray(range)) {
    if (range.length === 4) {
      out.start0 = range[0]
      out.start1 = range[1]
      out.end1 = range[2]
      out.end0 = range[3]
      return out
    }

    if (range.length === 3) {
      const [start, end, outFadeLength] = range
      out.start0 = start - outFadeLength
      out.start1 = start
      out.end1 = end
      out.end0 = end + outFadeLength
      return out
    }

    throw new Error('Invalid fuzzy range array length')
  }

  if (range && typeof range === 'object') {
    if (isFuzzyRangeType(range)) {
      Object.assign(out, range)
      return out
    }

    if ('center' in range && 'length' in range) {
      if ('fade' in range) {
        const { center, length, fade } = range
        out.start0 = center - length / 2 - fade
        out.start1 = center - length / 2
        out.end1 = center + length / 2
        out.end0 = center + length / 2 + fade
        return out
      }

      if ('outerLength' in range) {
        const { center, length, outerLength } = range
        const fade = (outerLength - length) / 2
        out.start0 = center - length / 2 - fade
        out.start1 = center - length / 2
        out.end1 = center + length / 2
        out.end0 = center + length / 2 + fade
        return out
      }
    }
  }

  throw new Error('Invalid fuzzy range declaration')
}

/**
 * FuzzyRange is a utility for defining and evaluating ranges with soft edges.
 * 
 * It allows you to specify a range with a start and end point, along with
 * fade lengths on both sides. The range can be evaluated at any point to get
 * a value between 0 and 1, where 0 means "outside the range" and 1 means "inside the range".
 * Values between 0 and 1 represent the fade-in and fade-out areas.
 * 
 * Usage examples:
 * 
 * ```ts
 * // Create a FuzzyRange from explicit boundaries
 * const range1 = new FuzzyRange([0, 0.5, 0.5, 1])
 * range1.evaluate(0.25) // 0.5
 * range1.set(0, .5, .5, 1).evaluate(.25, 'out2') // 0.75
 * ```
 * 
 * ```ts
 * // Create a FuzzyRange from center, length, and fade
 * const range2 = new FuzzyRange({ center: 0.5, length: 0.5, fade: 0.1 })
 * ```
 * 
 * Inside a for loop:
 * ```ts
 * function myAnimation(progress: number) {
 *   const max = 4
 *   const offset = .2
 *   for (let i = 0; i < max; i++) {
 *     const t = FuzzyRange.dummy
 *       .set(0, .25, .66, 1)
 *       .scale(1 - offset)
 *       .offset(i / (max - 1) * offset)
 *       .evaluate(progress, 'inout(3, 1/3)')
 *     myItems[i].opacity = t
 *   }
 * }
 * ```
 */
export class FuzzyRange implements FuzzyRangeType {
  static evaluate(x: number, start0: number, start1: number, end1: number, end0: number, ease?: TransitionDeclaration): number
  static evaluate(x: number, range: FuzzyRangeDeclaration, ease?: TransitionDeclaration): number
  static evaluate(x: number, ...args: any[]): number {
    if (args.length >= 4) {
      const [start0, start1, end1, end0, ease] = args
      _dummy.start0 = start0
      _dummy.start1 = start1
      _dummy.end1 = end1
      _dummy.end0 = end0
      return evaluate(x, _dummy, ease)
    }

    const [range, ease] = args as [FuzzyRangeDeclaration, TransitionDeclaration]
    fromFuzzyRangeDeclaration(range, _dummy)
    return evaluate(x, _dummy, ease)
  }

  /**
   * A dummy instance that can be reused to avoid allocations.
   * 
   * Use it immediately or clone it if you need to keep its state.
   */
  static dummy = new FuzzyRange()

  start0 = 0
  start1 = 0
  end1 = 0
  end0 = 0

  get length() {
    return this.end1 - this.start1
  }

  get outerLength() {
    return this.end0 - this.start0
  }

  constructor(declaration?: FuzzyRangeDeclaration) {
    if (declaration) {
      fromFuzzyRangeDeclaration(declaration, this)
    }
  }

  copy(other: FuzzyRangeType): this {
    this.start0 = other.start0
    this.start1 = other.start1
    this.end1 = other.end1
    this.end0 = other.end0
    return this
  }

  clone(): this {
    return new (this.constructor as new () => this)().copy(this)
  }

  set(start0: number, start1: number, end1: number, end0: number): this {
    this.start0 = start0
    this.start1 = start1
    this.end1 = end1
    this.end0 = end0
    return this
  }

  from(declaration: FuzzyRangeDeclaration): this {
    fromFuzzyRangeDeclaration(declaration, this)
    return this
  }

  evaluate(x: number, ease?: TransitionDeclaration | [start: TransitionDeclaration, end: TransitionDeclaration]): number {
    return evaluate(x, this, ease)
  }

  computePosition(x: number): FuzzyRangePosition {
    return computePosition(x, this)
  }

  offset(delta: number): this {
    this.start0 += delta
    this.start1 += delta
    this.end1 += delta
    this.end0 += delta
    return this
  }

  scale(factor: number, center = 0): this {
    this.start0 = center + (this.start0 - center) * factor
    this.start1 = center + (this.start1 - center) * factor
    this.end1 = center + (this.end1 - center) * factor
    this.end0 = center + (this.end0 - center) * factor
    return this
  }
}

