/**
 * This allows to use a regular 2D map as a 3D texture. Useful for LUT.
 * 
 * NOTE:
 * - "size" represents the size of the map in the following format:  
 *   `vec3(SIZE, 1 / SIZE, 1 / SIZE / SIZE)`
 * - The texture must have some properties set to some precise values:
 *   - Since interpolation (filter) is done manually here, the texture should use 
 *   the "Nearest Filter".
 *   - Color space must be set to "srgb-linear".
 *   - The texture should not generate mipmaps.
 */
export const glsl_sampleAs3d = /* glsl */`

  vec2 sampleAsTexture3D_vec3ToVec2(in vec3 size, float x, float y, float z) {
    x = min(x, size.x - 1.);
    y = min(y, size.x - 1.);
    z = min(z, size.x - 1.);
    return vec2((x + z * size.x) * size.z, y * size.y);
  }

  vec3 nearestSampleAsTexture3D(sampler2D map, vec3 size, vec3 coords) {
    coords *= size.x;
    vec3 coordsInt = floor(coords);

    float ix = coordsInt.x;
    float iy = coordsInt.y;
    float iz = coordsInt.z;

    return texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix, iy, iz)).rgb;
  }

  vec3 linearSampleAsTexture3D(sampler2D map, vec3 size, vec3 coords) {
    coords *= (size.x - 1.);
    vec3 coordsInt = floor(coords);
    vec3 coordsFrc = coords - coordsInt;
    
    float ix = coordsInt.x;
    float iy = coordsInt.y;
    float iz = coordsInt.z;

    float fx = coordsFrc.x;
    float fy = coordsFrc.y;
    float fz = coordsFrc.z;
    
    vec4 texel000 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 0., iy + 0., iz + 0.));
    vec4 texel100 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 1., iy + 0., iz + 0.));
    vec4 texel010 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 0., iy + 1., iz + 0.));
    vec4 texel110 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 1., iy + 1., iz + 0.));

    vec4 texel001 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 0., iy + 0., iz + 1.));
    vec4 texel101 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 1., iy + 0., iz + 1.));
    vec4 texel011 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 0., iy + 1., iz + 1.));
    vec4 texel111 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 1., iy + 1., iz + 1.));

    return mix(
      mix(
        mix(texel000.rgb, texel100.rgb, fx), 
        mix(texel010.rgb, texel110.rgb, fx),
        fy),
      mix(
        mix(texel001.rgb, texel101.rgb, fx), 
        mix(texel011.rgb, texel111.rgb, fx),
        fy),
      fz);
  }
`
