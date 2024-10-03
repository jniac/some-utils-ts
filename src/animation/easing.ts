import { clamp01 } from '../math/basic'
import {
  easeInOut,
  easeIn1 as in1,
  easeIn2 as in2,
  easeIn3 as in3,
  easeIn4 as in4,
  easeIn5 as in5,
  easeInOut1 as inOut1,
  easeInOut2 as inOut2,
  easeInOut3 as inOut3,
  easeInOut4 as inOut4,
  easeInOut5 as inOut5,
  easeOut1 as out1,
  easeOut2 as out2,
  easeOut3 as out3,
  easeOut4 as out4,
  easeOut5 as out5,
} from '../math/easings'
import { solveCubicEase } from '../math/easings/cubic-bezier'

const simple = {
  linear: clamp01,
  in1,
  in2,
  in3,
  in4,
  in5,
  out1,
  out2,
  out3,
  out4,
  out5,
  inOut1,
  inOut2,
  inOut3,
  inOut4,
  inOut5,
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

type EaseDeclaration =
  | SimpleEasingDeclaration
  | CubicBezierEasingDeclaration
  | CustomInOutEasingDeclaration

const cubicBezierCache = new Map<string, (x: number) => number>()
function cacheCubicBezier(declaration: string) {
  const [x1, y1, x2, y2] = declaration
    .slice('cubic-bezier('.length, -1)
    .trim()
    .split(/\s*,\s*/)
    .map(s => Number.parseFloat(s))
  const easing = (x: number) => solveCubicEase(x1, y1, x2, y2, x)
  cubicBezierCache.set(declaration, easing)
  return easing
}

const customInOutCache = new Map<string, (x: number) => number>()
function cacheCustomInOut(declaration: string) {
  const [a, b = .5] = declaration
    .trim()
    .slice('inOut('.length, -1)
    .split(/\s*,\s*/)
    .map(s => Number.parseFloat(s))
  const easing = (x: number) => easeInOut(x, a, b)
  customInOutCache.set(declaration, easing)
  return easing
}

function parseEase(declaration: EaseDeclaration): (value: number) => number {
  if (isSimpleEasingDeclaration(declaration)) {
    return simple[declaration]
  }
  if (isCubicBezierEasingDeclaration(declaration)) {
    return cubicBezierCache.get(declaration) ?? cacheCubicBezier(declaration)
  }
  if (isCustomInOutEasingDeclaration(declaration)) {
    return customInOutCache.get(declaration) ?? cacheCustomInOut(declaration)
  }
  throw new Error(`Invalid argument for Animation.ease(): "${declaration}"`)
}

export type {
  EaseDeclaration
}

/**
 * @deprecated Use `parseEase` instead
 */
const easing = parseEase

export {
  easing,
  parseEase
}

