import { glsl_easings } from './easings'
import { generics } from './tools/generics'

const ramp = /* glsl */`

struct FloatRamp {
  float a;
  float b;
  float t;
};

struct Vec2Ramp {
  vec2 a;
  vec2 b;
  float t;
};

struct Vec3Ramp {
  vec3 a;
  vec3 b;
  float t;
};

struct Vec4Ramp {
  vec4 a;
  vec4 b;
  float t;
};

${generics('vecX', type => {
  const Type = type[0].toUpperCase() + type.slice(1) + 'Ramp'
  return /* glsl */`

// 1 stop (simple linear interpolation)
${Type} ramp(float t, T a, T b) {
  return ${Type}(a, b, t);
}

// 2 stops
${Type} ramp(float t, T a, T b, T c) {
  if (t < 0.5) {
    return ${Type}(a, b, t * 2.0);
  } else {
    return ${Type}(b, c, t * 2.0 - 1.0);
  }
}

// 4 stops
${Type} ramp(float t, T a, T b, T c, T d) {
  if (t < 0.333) {
    return ${Type}(a, b, t * 3.0);
  } else if (t < 0.666) {
    return ${Type}(b, c, t * 3.0 - 1.0);
  } else {
    return ${Type}(c, d, t * 3.0 - 2.0);
  }
}

// 5 stops
${Type} ramp(float t, T a, T b, T c, T d, T e) {
  if (t < 0.25) {
    return ${Type}(a, b, t * 4.0);
  } else if (t < 0.5) {
    return ${Type}(b, c, t * 4.0 - 1.0);
  } else if (t < 0.75) {
    return ${Type}(c, d, t * 4.0 - 2.0);
  } else {
    return ${Type}(d, e, t * 4.0 - 3.0);
  }
}

`.slice(1, -1)
}
)}`

export const glsl_ramp = /* glsl */`
#ifndef GLSL_RAMP
#define GLSL_RAMP
${glsl_easings}
${ramp}
#endif
`
