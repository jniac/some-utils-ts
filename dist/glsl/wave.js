export const glsl_wave = /* glsl */ `

  float sawtoothWave(float x, float period) {
    return fract(x / period);
  }

  float sawtoothWave2P(float x, float period1, float period2) {
    float period = period1 + period2;
    float r = period1 / period;
    x = fract(x / period);
    return x < r ? x / r : (x - r) / (1.0 - r);
  }

  float hollowSawtoothWave(float x, float normalPeriod, float hollowPeriod) {
    float period = normalPeriod + hollowPeriod;
    float r = normalPeriod / period;
    x = fract(x / period);
    return x < r ? x / r : 0.0;
  }


  float toTriangleWave(float x) {
    return 2.0 * (x < 0.5 ? x : 1.0 - x);
  }

  float toSineWave(float y) {
    y = toTriangleWave(y);
    return 0.5 + 0.5 * cos((y - 1.0) * 3.141582);
  }

`;
