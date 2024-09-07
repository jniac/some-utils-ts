/**
 * GLSL functions for adjusting UV coordinates based on aspect ratio and size mode.
 * 
 * sizeMode: 0 for "contain", 1 for "cover"
 */
export const glsl_uv_size = /* glsl */ `
  // sizeMode: 0 for "contain", 1 for "cover"
  vec2 applyUvSize(vec2 uv, float outerAspect, float innerAspect, float sizeMode, vec2 align, vec2 scale) {
    align.y = 1.0 - align.y; // Flip y-coordinate
    if ((outerAspect > innerAspect) != (sizeMode == 1.0)) { // XOR condition for mode
      float scaleFactor = outerAspect / innerAspect;
      uv.x = (uv.x - align.x) * scaleFactor + align.x; // Adjust x-coordinate
    } else {
      float scaleFactor = innerAspect / outerAspect;
      uv.y = (uv.y - align.y) * scaleFactor + align.y; // Adjust y-coordinate
    }
    uv = (uv - align) / scale + align;
    return uv;
  }

  vec2 applyUvSize(vec2 uv, float outerAspect, float innerAspect, float sizeMode, vec2 align, float scale) {
    return applyUvSize(uv, outerAspect, innerAspect, sizeMode, align, vec2(scale));
  }

  vec2 applyUvSize(vec2 uv, float outerAspect, float innerAspect, float sizeMode, vec2 align) {
    return applyUvSize(uv, outerAspect, innerAspect, sizeMode, align, vec2(1.0));
  }

  vec2 applyUvSize(vec2 uv, float outerAspect, float innerAspect, float sizeMode) {
    return applyUvSize(uv, outerAspect, innerAspect, sizeMode, vec2(0.5));
  }

  vec2 applyUvSize(vec2 uv, float outerAspect, float innerAspect) {
    return applyUvSize(uv, outerAspect, innerAspect, 1.0);
  }
`
