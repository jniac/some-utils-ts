
import { bump } from './bump'
import { transition } from './transition'

export { bump } from './bump'
export { transition } from './transition'

export const easing = {
  // "Transition" is the default easing function
  ...transition,

  transition,
  bump,
}
