import { glsl_basic } from './basic'

export const easingsNames = [
  'linear',
]
for (let i = 1; i <= 10; i++) {
  easingsNames.push(`easeIn${i}`)
  easingsNames.push(`easeOut${i}`)
  easingsNames.push(`easeInOut${i}`)
  easingsNames.push(`easeOutIn${i}`)
}

export const glsl_easings = /* glsl */`
#ifndef GLSL_EASING
#define GLSL_EASING

${glsl_basic}

float easePow1(float x) {
  return x;
}

float easePow2(float x) {
  return x * x;
}

float easePow3(float x) {
  return x * x * x;
}

float easePow4(float x) {
  x *= x;
  return x *= x;
}

float easePow5(float x) {
  float x0 = x;
  x *= x;
  x *= x;
  return x0 * x;
}

float easePow6(float x) {
  x *= x * x;
  return x *= x;
}

float easePow7(float x) {
  float x0 = x;
  x *= x * x;
  x *= x;
  return x0 * x;
}

float easePow8(float x) {
  x *= x;
  x *= x;
  return x *= x;
}

float easePow9(float x) {
  x *= x * x;
  return x *= x * x;
}

float easePow10(float x) {
  float x0 = x;
  x *= x * x;
  x *= x * x;
  return x0 * x;
}

float linear(float x) {
  return clamp01(x);
}

${Array.from({ length: 10 }, (_, i) => {
  const p = i + 1
  return /* glsl */`

  float easeIn${p} (float x) {
    return easePow${p}(clamp01(x));
  }
  float easeOut${p} (float x) {
    return 1.0 - easePow${p}(clamp01(1.0 - x));
  }
  float easeInOut${p} (float x) {
    return x < 0.5 
      ? 0.5 * easePow${p}(2.0 * x) 
      : 1.0 - 0.5 * easePow${p}(2.0 * (1.0 - x));
  }
  float easeOutIn${p} (float x) {
    return x < 0.5
      ? 0.5 * (1.0 - easePow${p}(1.0 - x * 2.0))
      : 1.0 - 0.5 * (1.0 - easePow${p}(2.0 * x - 1.0));
  }

`.trim()
}).join('\n\n')}


// https://www.desmos.com/calculator/mqou4lf9zc?lang=fr
float easeInOut(float x, float p, float i) {
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
