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

${Type} ramp(float t, T a, T b) {
  return ${Type}(a, b, t);
}

${Type} ramp(float t, T a, T b, T c) {
  if (t < .5) {
    return ${Type}(a, b, t * 2.0);
  } else {
    return ${Type}(b, c, (t - 0.5) * 2.0);
  }
}

${Type} ramp(float t, T a, T b, T c, T d) {
  if (t < .33) {
    return ${Type}(a, b, t * 3.0);
  } else if (t < .66) {
    return ${Type}(b, c, (t - 0.33) * 3.0);
  } else {
    return ${Type}(c, d, (t - 0.66) * 3.0);
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
