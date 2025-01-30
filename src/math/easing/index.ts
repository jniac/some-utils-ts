
import { bump } from './bump'
import { transition } from './transition'

export { bump } from './bump'
export { transition } from './transition'

/**
 * Easing functions.
 * Backwards-compatible aliases for `transition`.
 * Prefer using `transition` directly eg:
 * ```
 * import { transition } from 'some-utils-ts/math/easing'
 * const t = transition.inOut3(0.5)
 * ```
 */
export {
  in1 as easeIn1,
  in2 as easeIn2,
  in3 as easeIn3,
  in4 as easeIn4,
  in5 as easeIn5,
  in6 as easeIn6,

  inOut as easeInOut,
  inOut1 as easeInOut1,
  inOut2 as easeInOut2,
  inOut3 as easeInOut3,
  inOut4 as easeInOut4,
  inOut5 as easeInOut5,
  inOut6 as easeInOut6,

  out1 as easeOut1,
  out2 as easeOut2,
  out3 as easeOut3,
  out4 as easeOut4,
  out5 as easeOut5,
  out6 as easeOut6
} from './transition'

export const easing = {
  transition,
  bump,
}
