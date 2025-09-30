import { generics } from './tools/generics'

export const glsl_blending = /* glsl */`
#ifndef BLENDING
#define BLENDING

${generics('vecX', /* glsl */`
  T blendingMultiply(in T a, in T b) {
    return a * b;
  }
`)}

${generics('vecX', /* glsl */`
  T blendingScreen(in T a, in T b) {
    return 1.0 - (1.0 - a) * (1.0 - b);
  }
`)}

#endif
`