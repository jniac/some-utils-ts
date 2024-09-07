export const glsl = /* glsl */`

  // https://www.shadertoy.com/view/4t2SzR
  vec3 blendNormals(vec3 n1, vec3 n2) {
    n1 += vec3( 0,  0, 1);
    n2 *= vec3(-1, -1, 1);
    return n1 * dot(n1, n2) / n1.z - n2;
  }

`