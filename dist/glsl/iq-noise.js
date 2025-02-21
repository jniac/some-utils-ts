export const glsl_iq_noise = /* glsl */ `

float iq_hash(vec3 p)  // replace this by something better // ok for me ... ;)
{
  p = fract(p * 0.3183099 + .1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float iq_noise3(in vec3 x)
{
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  
  return mix(mix(mix( iq_hash(i + vec3(0,0,0)), 
                      iq_hash(i + vec3(1,0,0)),f.x),
                  mix(iq_hash(i + vec3(0,1,0)), 
                      iq_hash(i + vec3(1,1,0)),f.x),f.y),
              mix(mix(iq_hash(i + vec3(0,0,1)), 
                      iq_hash(i + vec3(1,0,1)),f.x),
                  mix(iq_hash(i + vec3(0,1,1)), 
                      iq_hash(i + vec3(1,1,1)),f.x),f.y),f.z);
}

`;
