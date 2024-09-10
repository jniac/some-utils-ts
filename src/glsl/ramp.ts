import { easingsNames, glsl_easings } from './easings'
import { generics } from './tools/generics'

const body = easingsNames.map(ease => {
  const Ease = ease[0].toUpperCase() + ease.slice(1)
  return /* glsl */`
  ${generics('vecX', /* glsl */`
    T regularRamp${Ease}(in float x, in T stop1, in T stop2) {
      return mix(stop1, stop2, x);
    }
  `)}
  
  ${generics('vecX', /* glsl */`
    T regularRamp${Ease}(in float x, in T stop1, in T stop2, in T stop3) {
      T a, b;
      float t;
      if (x < 0.5) {
        a = stop1;
        b = stop2;
        t = 2.0 * x;
      } else {
        a = stop2;
        b = stop3;
        t = 2.0 * x - 1.0;
      }
      return mix(a, b, ${ease}(t));
    }
  `)}
  
  ${generics('vecX', /* glsl */`
    T regularRamp${Ease}(in float x, in T stop1, in T stop2, in T stop3, in T stop4) {
      T a, b;
      float t;
      if (x < 0.3333333333) {
        a = stop1;
        b = stop2;
        t = 3.0 * x;
      } else if (x < 0.6666666666) {
        a = stop2;
        b = stop3;
        t = 3.0 * x - 1.0;
      } else {
        a = stop3;
        b = stop4;
        t = 3.0 * x - 2.0;
      }
      return mix(a, b, ${ease}(t));
    }
  `)}
`}).join('\n')

export const glsl_ramp = /* glsl */`
#ifndef GLSL_RAMP
#define GLSL_RAMP
${glsl_easings}
${body}
#endif
`