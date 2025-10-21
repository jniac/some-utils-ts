export const glsl_bend = /* glsl */`
#ifndef GLSL_BEND
#define GLSL_BEND
  vec4 applyBend(vec4 position, float factor, mat4 bendMatrix, mat4 bendMatrixInverse) {
    float q = 1.0 / factor;
    
    if (abs(factor) < 0.0001)
      return position;
    
    position = bendMatrixInverse * position;
    vec2 center = vec2(0.0, q);
    float a = position.x / q;
    float r = center.y - position.y;
    position.x = center.x + r * sin(a);
    position.y = center.y + -r * cos(a);
    position = bendMatrix * position;
    return position;
  }
#endif
`