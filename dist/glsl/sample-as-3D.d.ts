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
export declare const glsl_sampleAs3d = "\n\n  vec2 sampleAsTexture3D_vec3ToVec2(in vec3 size, float x, float y, float z) {\n    x = min(x, size.x - 1.);\n    y = min(y, size.x - 1.);\n    z = min(z, size.x - 1.);\n    return vec2((x + z * size.x) * size.z, y * size.y);\n  }\n\n  vec3 nearestSampleAsTexture3D(sampler2D map, vec3 size, vec3 coords) {\n    coords *= size.x;\n    vec3 coordsInt = floor(coords);\n\n    float ix = coordsInt.x;\n    float iy = coordsInt.y;\n    float iz = coordsInt.z;\n\n    return texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix, iy, iz)).rgb;\n  }\n\n  vec3 linearSampleAsTexture3D(sampler2D map, vec3 size, vec3 coords) {\n    coords *= (size.x - 1.);\n    vec3 coordsInt = floor(coords);\n    vec3 coordsFrc = coords - coordsInt;\n    \n    float ix = coordsInt.x;\n    float iy = coordsInt.y;\n    float iz = coordsInt.z;\n\n    float fx = coordsFrc.x;\n    float fy = coordsFrc.y;\n    float fz = coordsFrc.z;\n    \n    vec4 texel000 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 0., iy + 0., iz + 0.));\n    vec4 texel100 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 1., iy + 0., iz + 0.));\n    vec4 texel010 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 0., iy + 1., iz + 0.));\n    vec4 texel110 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 1., iy + 1., iz + 0.));\n\n    vec4 texel001 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 0., iy + 0., iz + 1.));\n    vec4 texel101 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 1., iy + 0., iz + 1.));\n    vec4 texel011 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 0., iy + 1., iz + 1.));\n    vec4 texel111 = texture2D(map, sampleAsTexture3D_vec3ToVec2(size, ix + 1., iy + 1., iz + 1.));\n\n    return mix(\n      mix(\n        mix(texel000.rgb, texel100.rgb, fx), \n        mix(texel010.rgb, texel110.rgb, fx),\n        fy),\n      mix(\n        mix(texel001.rgb, texel101.rgb, fx), \n        mix(texel011.rgb, texel111.rgb, fx),\n        fy),\n      fz);\n  }\n";
//# sourceMappingURL=sample-as-3D.d.ts.map