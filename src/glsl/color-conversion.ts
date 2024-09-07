export const glsl_color_conversion = /* glsl */`

float hue2rgb(float p, float q, float t) {
  t = fract(t); // Ensure t is in the range [0, 1]
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0 / 2.0) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 c) {
  vec3 rgb;
  
  if (c.y == 0.0) {
    rgb = vec3(c.z); // achromatic
  } else {
    float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y;
    float p = 2.0 * c.z - q;
    rgb.r = hue2rgb(p, q, c.x + 1.0 / 3.0);
    rgb.g = hue2rgb(p, q, c.x);
    rgb.b = hue2rgb(p, q, c.x - 1.0 / 3.0);
  }
  
  return rgb;
}

vec3 rgb2hsl(vec3 c) {
  vec3 hsl;
  
  float maxVal = max(max(c.r, c.g), c.b);
  float minVal = min(min(c.r, c.g), c.b);
  
  hsl.z = (maxVal + minVal) / 2.0;
  
  if (maxVal == minVal) {
    hsl.x = hsl.y = 0.0; // achromatic
  } else {
    float d = maxVal - minVal;
    
    hsl.y = hsl.z < 0.5 ? d / (maxVal + minVal) : d / (2.0 - maxVal - minVal);
    
    if (maxVal == c.r) {
      hsl.x = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    } else if (maxVal == c.g) {
      hsl.x = (c.b - c.r) / d + 2.0;
    } else {
      hsl.x = (c.r - c.g) / d + 4.0;
    }
    
    hsl.x /= 6.0;
  }
  
  return hsl;
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

`