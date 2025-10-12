export const glsl_basic = /* glsl */`
#ifndef GLSL_BASIC
#define GLSL_BASIC

float clamp01(float x) {
  return x < 0.0 ? 0.0 : x > 1.0 ? 1.0 : x;
}

vec2 clamp01(vec2 x) {
  return vec2(clamp01(x.x), clamp01(x.y));
}

vec3 clamp01(vec3 x) {
  return vec3(clamp01(x.x), clamp01(x.y), clamp01(x.z));
}

vec4 clamp01(vec4 x) {
  return vec4(clamp01(x.x), clamp01(x.y), clamp01(x.z), clamp01(x.w));
}

#endif
`
