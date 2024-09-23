import { Animation } from '../animation'
import { EasingDeclaration } from '../animation/easing'
import { Color4, ColorDeclaration } from '../math/color'

const defaultOptions = {
  easing: 'out2' as EasingDeclaration,
  subdivisions: 5,
}

type Options = Partial<typeof defaultOptions>

/**
 * Because linear interpolated gradient are awfull compared to eased ones. 
 */
export function createGradientStops(color1: ColorDeclaration, color2: ColorDeclaration, options?: Options) {
  const { easing, subdivisions } = { ...defaultOptions, ...options }
  const easeFn = Animation.easing(easing)
  const c1 = Color4.from(color1)
  const c2 = Color4.from(color2)
  const stops = Array.from({ length: subdivisions + 2 }, (_, i) => {
    const t = i / (subdivisions + 1)
    const a = easeFn(t)
    return Color4.lerpColors(c1, c2, a).toCSS('hex')
  })
  return stops
}
