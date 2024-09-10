export const glsl_basic = /* glsl */`
#ifndef GLSL_BASIC
#define GLSL_BASIC

float clamp01(float x) {
  return x < 0.0 ? 0.0 : x > 1.0 ? 1.0 : x;
}

#endif
`
