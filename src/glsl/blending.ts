import { generics } from './tools/generics'

/**
 * Options from [MDN mix-blend-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode):
 * - ✅ normal
 * - ✅ multiply
 * - ✅ screen
 * - ✅ overlay
 * - ✅ darken
 * - ✅ lighten
 * - color-dodge
 * - color-burn
 * - hard-light
 * - soft-light
 * - ✅ difference
 * - exclusion
 * - hue
 * - saturation
 * - color
 * - luminosity
 * - plus-darker
 * - plus-lighter
 */
export const glsl_blending = /* glsl */`
#ifndef BLENDING
#define BLENDING

${generics('vecX', /* glsl */`
  T multiplyBlending(in T a, in T b) {
    return a * b;
  }
`)}

${generics('vecX', /* glsl */`
  T screenBlending(in T a, in T b) {
    return 1.0 - (1.0 - a) * (1.0 - b);
  }
`)}

float overlayBlending(in float a, in float b) {
  return a < 0.5 ? (2.0 * a * b) : (1.0 - 2.0 * (1.0 - a) * (1.0 - b));
}

vec2 overlayBlending(in vec2 a, in vec2 b) {
  return vec2(
    overlayBlending(a.x, b.x),
    overlayBlending(a.y, b.y));
}

vec3 overlayBlending(in vec3 a, in vec3 b) {
  return vec3(
    overlayBlending(a.x, b.x),
    overlayBlending(a.y, b.y),
    overlayBlending(a.z, b.z));
}

vec4 overlayBlending(in vec4 a, in vec4 b) {
  return vec4(
    overlayBlending(a.x, b.x),
    overlayBlending(a.y, b.y),
    overlayBlending(a.z, b.z),
    overlayBlending(a.w, b.w));
}

${generics('vecX', /* glsl */`
  T darkenBlending(in T a, in T b) {
    return max(a, b);
  }
`)}

${generics('vecX', /* glsl */`
  T lightenBlending(in T a, in T b) {
    return max(a, b);
  }
`)}

${generics('vecX', /* glsl */`
  T differenceBlending(in T a, in T b) {
    return abs(a - b);
  }
`)}

#endif
`