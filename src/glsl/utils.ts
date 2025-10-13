import { glsl_basic } from './basic'
import { generics } from './tools/generics'

export const glsl_utils = /* glsl */`
${glsl_basic}

#ifndef GLSL_UTILS
#define GLSL_UTILS

float sin01(float x) {
  return 0.5 + 0.5 * sin(x * 6.283185307179586);
}

vec2 scaleAround(vec2 p, vec2 c, float s) {
  return c + (p - c) / s;
}

// Same as mix, but clamped.
${generics('vecX', /* glsl */`
  T lerp(in T a, in T b, in float x) {
    return mix(a, b, clamp01(x));
  }
`)}

float inverseLerpUnclamped(in float a, in float b, float x) {
  return (x - a) / (b - a);
}

float inverseLerp(in float a, in float b, float x) {
  return clamp01((x - a) / (b - a));
}

float remap(in float x, in float a, in float b, in float c, in float d) {
  return c + (d - c) * inverseLerp(a, b, x);
}

// Remap from [-1, 1] to [0, 1]
float remap1101(in float x) {
  return clamp01(0.5 + 0.5 * x);
}

${generics('vecX', /* glsl */`
  T oneMinus(in T x) {
    return 1.0 - x;
  }
`)}

// Returns x^p, but handles negative x values correctly.
float spow(in float x, in float p) {
  return x >= 0.0 ? pow(x, p) : -pow(-x, p);
}

float threshold(in float x, in float thresholdValue) {
  return x < thresholdValue ? 0. : 1.;
}

float threshold(in float x, in float thresholdValue, in float width) {
  return width < 1e-9 
    ? (x < thresholdValue ? 0. : 1.)
    : clamp01((x - thresholdValue + width * .5) / width);
}

mat3 extractRotation(mat4 matrix) {
  return mat3(matrix[0].xyz, matrix[1].xyz, matrix[2].xyz);
}

vec2 rotate(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  float x = c * p.x + s * p.y;
  float y = -s * p.x + c * p.y;
  return vec2(x, y);
}

vec2 rotateAround(vec2 p, float a, vec2 c) {
  return c + rotate(p - c, a);
}

vec2 rotateScaleAround(vec2 p, float a, float s, vec2 c) {
  return c + rotate((p - c) / s, a);
}

float positiveModulo(float x) {
  x = mod(x, 1.0);
  return x < 0.0 ? x + 1.0 : x;
}

// Modulo that keeps the result in the range [0, modulo]
float positiveModulo(float x, float modulo) {
  x = mod(x, modulo);
  return x < 0.0 ? x + modulo : x;
}

// Modulo that keeps the result in the range [-m/2, m/2]
float middleModulo(float x, float modulo) {
  x = mod(x, modulo);
  return x < -modulo / 2.0 ? x + modulo : x > modulo / 2.0 ? x - modulo : x;
}

// Limit a value to a maximum that the function tends to reach when x -> ∞
// https://www.desmos.com/calculator/0vewkbnscu
float limited(float x, float maxValue) {
  return x <= 0.0 ? x : maxValue * x / (maxValue + x);
}

// Symmetric version of limited
// 
// Limit a value to a maximum that the function tends to reach when x -> ∞
// and a minimum (-maximum) that the function tends to reach when x -> -∞
// https://www.desmos.com/calculator/0vewkbnscu
float slimited(float x, float maxValue) {
  return x <= 0.0
    ? -limited(-x, maxValue)
    : limited(x, maxValue);
}

// https://www.desmos.com/calculator/0vewkbnscu
float limited(float x, float minValue, float maxValue) {
  float d = maxValue - minValue;
  float xd = x - minValue;
  return x <= minValue ? x : minValue + d * xd / (d + xd);
}

// Symmetric version of limited
float slimited(float x, float minValue, float maxValue) {
  return x <= 0.0
    ? -limited(-x, maxValue, minValue)
    : limited(x, minValue, maxValue);
}

float sqLength(in vec2 p) {
  return p.x * p.x + p.y * p.y;
}

float sqLength(in vec3 p) {
  return p.x * p.x + p.y * p.y + p.z * p.z;
}

float pcurve(float x, float a, float b) {
  float k = pow(a + b, a + b) / (pow(a, a) * pow(b, b));
  return k * pow(x, a) * pow(1.0 - x, b);
}

float hash(float p) {
  return fract(sin(p * 12.9898) * 43758.5453);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

float hash(vec4 p) {
  return fract(sin(dot(p, vec4(12.9898, 78.233, 45.164, 94.673))) * 43758.5453);
}

vec2 hash2(float p) {
  return vec2(hash(p), hash(p + 1.0));
}

vec2 hash2(vec2 p) {
  return vec2(hash(p.x), hash(p.y));
}

vec2 hash2(vec3 p) {
  return vec2(hash(p.xy), hash(p.yz));
}

vec2 hash2(vec4 p) {
  return vec2(hash(p.xyz), hash(p.yzw));
}

vec3 hash3(float p) {
  return vec3(hash2(p),  hash(p + 2.0));
}

vec3 hash3(vec2 p) {
  return vec3(hash2(p), hash(p));
}

vec3 hash3(vec3 p) {
  return vec3(hash(p.x), hash(p.y), hash(p.z));
}

vec3 hash3(vec4 p) {
  return vec3(hash(p.xy), hash(p.yz), hash(p.zw));
}

float hash_alt(float p) {
  return fract(sin(p * 127.1) * 311.7);
}

float hash_alt(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 269.5);
}

float hash_alt(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 269.5);
}

float hash_alt(vec4 p) {
  return fract(sin(dot(p, vec4(127.1, 311.7, 74.7, 113.5))) * 269.5);
}

${generics('vecX', /* glsl */`
  T min3(in T a, in T b, in T c) {
    return min(min(a, b), c);
  }
`)}

${generics('vecX', /* glsl */`
  T min4(in T a, in T b, in T c, in T d) {
    return min(min(a, b), min(c, d));
  }
`)}

#endif // GLSL_UTILS
`