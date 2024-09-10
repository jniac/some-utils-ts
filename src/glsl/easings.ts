import { glsl_basic } from './basic'

export const easingsNames = [
  'linear',
  'easeIn1',
  'easeIn2',
  'easeIn3',
  'easeIn4',
  'easeIn5',
  'easeIn6',
  'easeOut1',
  'easeOut2',
  'easeOut3',
  'easeOut4',
  'easeOut5',
  'easeOut6',
  'easeInout1',
  'easeInout2',
  'easeInout3',
  'easeInout4',
  'easeInout5',
  'easeInout6',
]

export const glsl_easings = /* glsl */`
#ifndef GLSL_EASING
#define GLSL_EASING

${glsl_basic}

float linear(float x) {
  return clamp01(x);
}

float easeIn1 (float x) {
  x = clamp01(x);
  return x;
}
float easeIn2 (float x) {
  x = clamp01(x);
  return x * x;
}
float easeIn3 (float x) {
  x = clamp01(x);
  return x * x * x;
}
float easeIn4 (float x) {
  x = clamp01(x);
  return x * x * x * x;
}
float easeIn5 (float x) {
  x = clamp01(x);
  return x * x * x * x * x;
}
float easeIn6 (float x) {
  x = clamp01(x);
  x *= x * x;
  return x * x;
}

float easeOut1 (float x) {
  x = clamp01(x);
  return x;
}
float easeOut2 (float x) {
  x = clamp01(x);
  return 1.0 - (x = 1.0 - x) * x;
}
float easeOut3 (float x) {
  x = clamp01(x);
  return 1.0 - (x = 1.0 - x) * x * x;
}
float easeOut4 (float x) {
  x = clamp01(x);
  return 1.0 - (x = 1.0 - x) * x * x * x;
}
float easeOut5 (float x) {
  x = clamp01(x);
  return 1.0 - (x = 1.0 - x) * x * x * x * x;
}
float easeOut6 (float x) {
  x = clamp01(x);
  x = 1.0 - x;
  x *= x * x;
  return 1.0 - x * x;
}

float easeInout1 (float x) {
  x = clamp01(x);
  return x;
}
float easeInout2 (float x) {
  x = clamp01(x);
  return x < 0.5 ? 2.0 * x * x : 1.0 - 2.0 * (x = 1.0 - x) * x;
}
float easeInout3 (float x) {
  x = clamp01(x);
  return x < 0.5 ? 4.0 * x * x * x : 1.0 - 4.0 * (x = 1.0 - x) * x * x;
}
float easeInout4 (float x) {
  x = clamp01(x);
  return x < 0.5 ? 8.0 * x * x * x * x : 1.0 - 8.0 * (x = 1.0 - x) * x * x * x;
}
float easeInout5 (float x) {
  x = clamp01(x);
  return x < 0.5 ? 16.0 * x * x * x * x * x : 1.0 - 16.0 * (x = 1.0 - x) * x * x * x * x;
}
float easeInout6 (float x) {
  x = clamp01(x);
  return x < 0.5 ? 32.0 * x * x * x * x * x * x : 1.0 - 32.0 * (x = 1.0 - x) * x * x * x * x * x;
}

// https://www.desmos.com/calculator/mqou4lf9zc?lang=fr
float easeInout(float x, float p, float i) {
  return  x <= 0.0 ? 0.0 :
          x >= 1.0 ? 1.0 :
          x <= i ? 1.0 / pow(i, p - 1.0) * pow(x, p) :
          1.0 - 1.0 / pow(1.0 - i, p - 1.0) * pow(1.0 - x, p);
}

// https://www.desmos.com/calculator/nrjlezusdv
float easeInThenOut(float x, float p) {
  return 1.0 - pow(abs(2.0 * x - 1.0), p);
}

#endif
`
