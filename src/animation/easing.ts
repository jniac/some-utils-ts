import { clamp01 } from '../math/basic'
import {
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
import { solveCubicEasing } from '../math/easings/cubic-bezier'

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
const isSimpleEasingDeclaration = (arg: string): arg is SimpleEasingDeclaration => arg in simple

type CubicBezierEasingDeclaration = `cubic-bezier(${number}, ${number}, ${number}, ${number})`
const isCubicBezierEasingDeclaration = (arg: string): arg is CubicBezierEasingDeclaration => arg.startsWith('cubic-bezier(') && arg.endsWith(')')

type EasingDeclaration = SimpleEasingDeclaration | CubicBezierEasingDeclaration

const parametricEasingMap = new Map<string, (x: number) => number>()
function cacheParametricEasing(declaration: string) {
  const [x1, y1, x2, y2] = declaration
    .slice(13, -1)
    .split(/\s*,\s*/)
    .map(s => Number.parseFloat(s))
  const easing = (x: number) => solveCubicEasing(x1, y1, x2, y2, x)
  parametricEasingMap.set(declaration, easing)
  return easing
}

function easing(declaration: EasingDeclaration): (value: number) => number {
  if (isSimpleEasingDeclaration(declaration)) {
    return simple[declaration]
  }
  if (isCubicBezierEasingDeclaration(declaration)) {
    return parametricEasingMap.get(declaration) ?? cacheParametricEasing(declaration)
  }
  throw new Error(`Invalid argument for Animation.easing(): "${declaration}"`)
}

export type {
  EasingDeclaration
}

export {
  easing
}

