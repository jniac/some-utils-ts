export const glsl_bend = /* glsl */`
#ifndef GLSL_BEND
#define GLSL_BEND

  void applyBend(
    inout vec4 position,
    inout vec3 normal,
    float factor,
    mat4 bendMatrix,
    mat4 bendMatrixInverse
  ) {
    if (abs(factor) < 0.0001) {
      return;
    }

    position = bendMatrixInverse * position;
    normal = mat3(bendMatrixInverse) * normal;

    float angle = position.x * factor;
    float radiusFactor = 1.0 - position.y * factor;

    float c = cos(angle);
    float s = sin(angle);

    float safeRadiusFactor =
      abs(radiusFactor) < 0.000001
        ? (radiusFactor < 0.0 ? -0.000001 : 0.000001)
        : radiusFactor;

    normal = vec3(
      c * normal.x / safeRadiusFactor - s * normal.y,
      s * normal.x / safeRadiusFactor + c * normal.y,
      normal.z
    );

    float q = 1.0 / factor;
    float radius = q - position.y;

    position.xy = vec2(
      radius * s,
      q - radius * c
    );

    position = bendMatrix * position;
    normal = normalize(mat3(bendMatrix) * normal);
  }
  
#endif
`