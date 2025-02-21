export declare const glsl_iq_noise = "\n\nfloat iq_hash(vec3 p)  // replace this by something better // ok for me ... ;)\n{\n  p = fract(p * 0.3183099 + .1);\n  p *= 17.0;\n  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));\n}\n\nfloat iq_noise3(in vec3 x)\n{\n  vec3 i = floor(x);\n  vec3 f = fract(x);\n  f = f * f * (3.0 - 2.0 * f);\n  \n  return mix(mix(mix( iq_hash(i + vec3(0,0,0)), \n                      iq_hash(i + vec3(1,0,0)),f.x),\n                  mix(iq_hash(i + vec3(0,1,0)), \n                      iq_hash(i + vec3(1,1,0)),f.x),f.y),\n              mix(mix(iq_hash(i + vec3(0,0,1)), \n                      iq_hash(i + vec3(1,0,1)),f.x),\n                  mix(iq_hash(i + vec3(0,1,1)), \n                      iq_hash(i + vec3(1,1,1)),f.x),f.y),f.z);\n}\n\n";
