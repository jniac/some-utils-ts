import { bump } from '../math/easing/bump'
import { solveCubicEase } from '../math/easing/cubic-bezier'
import { transition } from '../math/easing/transition'

const simple = {
  linear: transition.linear,
  in1: transition.in1,
  in2: transition.in2,
  in3: transition.in3,
  in4: transition.in4,
  in5: transition.in5,
  in6: transition.in6,
  out1: transition.out1,
  out2: transition.out2,
  out3: transition.out3,
  out4: transition.out4,
  out5: transition.out5,
  out6: transition.out6,
  inOut1: transition.inOut1,
  inOut2: transition.inOut2,
  inOut3: transition.inOut3,
  inOut4: transition.inOut4,
  inOut5: transition.inOut5,
  inOut6: transition.inOut6,
}

type SimpleEasingDeclaration = keyof typeof simple
function isSimpleEasingDeclaration(arg: string): arg is SimpleEasingDeclaration {
  return arg in simple
}

type CubicBezierEasingDeclaration = `cubic-bezier(${number}, ${number}, ${number}, ${number})`
function isCubicBezierEasingDeclaration(arg: string): arg is CubicBezierEasingDeclaration {
  return arg.startsWith('cubic-bezier(') && arg.endsWith(')')
}

type CustomInOutEasingDeclaration = `inOut(${number})` | `inOut(${number}, ${number})`
function isCustomInOutEasingDeclaration(arg: string): arg is CustomInOutEasingDeclaration {
  return arg.startsWith('inOut(') && arg.endsWith(')')
}

type ElasticInPlaceEasingDeclaration = `elasticInPlace` | `elasticInPlace(${number})` | `elasticInPlace(${number}, ${number})`
function isElasticInPlaceEasingDeclaration(arg: string): arg is ElasticInPlaceEasingDeclaration {
  return arg === 'elasticInPlace' || (arg.startsWith('elasticInPlace(') && arg.endsWith(')'))
}

type EaseDeclaration =
  | ((t: number) => number)
  | SimpleEasingDeclaration
  | CubicBezierEasingDeclaration
  | CustomInOutEasingDeclaration
  | ElasticInPlaceEasingDeclaration


const easeCache = new Map<string, (x: number) => number>()

function cacheCubicBezier(declaration: string) {
  const [x1, y1, x2, y2] = declaration
    .slice('cubic-bezier('.length, -1)
    .trim()
    .split(/\s*,\s*/)
    .map(s => Number.parseFloat(s))
  const ease = (x: number) => solveCubicEase(x1, y1, x2, y2, x)
  easeCache.set(declaration, ease)
  return ease
}

function cacheCustomInOut(declaration: string) {
  const [a, b = .5] = declaration
    .trim()
    .slice('inOut('.length, -1)
    .split(/\s*,\s*/)
    .map(s => Number.parseFloat(s))
  const ease = (x: number) => transition.inOut(x, a, b)
  easeCache.set(declaration, ease)
  return ease
}

function cacheElasticInPlace(declaration: string) {
  const [f = undefined, p = undefined] = declaration
    .trim()
    .slice('elasticInPlace('.length, -1)
    .split(/\s*,\s*/)
    .map(s => Number.parseFloat(s))
  const ease = (x: number) => bump.elastic(x, f, p)
  easeCache.set(declaration, ease)
  return ease
}

function fromEaseDeclaration(declaration: EaseDeclaration): (value: number) => number {
  if (typeof declaration === 'function') {
    return declaration
  }
  if (isSimpleEasingDeclaration(declaration)) {
    return simple[declaration]
  }
  if (isCubicBezierEasingDeclaration(declaration)) {
    return easeCache.get(declaration) ?? cacheCubicBezier(declaration)
  }
  if (isCustomInOutEasingDeclaration(declaration)) {
    return easeCache.get(declaration) ?? cacheCustomInOut(declaration)
  }
  if (isElasticInPlaceEasingDeclaration(declaration)) {
    return easeCache.get(declaration) ?? cacheElasticInPlace(declaration)
  }
  throw new Error(`Invalid argument for Animation.ease(): "${declaration}"`)
}

function remap(
  x: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  easeArg: ((x: number) => number) | EaseDeclaration = 'inOut2',
) {
  const t = (x - inMin) / (inMax - inMin)
  const tClamped = t < 0 ? 0 : t > 1 ? 1 : t
  const fn = typeof easeArg === 'function' ? easeArg : fromEaseDeclaration(easeArg)
  const y = fn(tClamped)
  return outMin + (outMax - outMin) * y
}


export type {
  EaseDeclaration
}

/**
 * @deprecated Use `fromEaseDeclaration` instead
 */
const easing = fromEaseDeclaration

/**
 * @deprecated Use `fromEaseDeclaration` instead
 */
const parseEase = fromEaseDeclaration

export {
  easing,
  fromEaseDeclaration,
  parseEase,
  remap
}

