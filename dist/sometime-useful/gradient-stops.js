import { Animation } from '../animation.js';
import { Color4 } from '../math/color.js';
const defaultOptions = {
    ease: 'out2',
    subdivisions: 5,
};
/**
 * Because linear interpolated gradient are awfull compared to eased ones.
 */
export function createGradientStops(color1, color2, options) {
    const { ease, subdivisions } = { ...defaultOptions, ...options };
    const easeFn = Animation.ease(ease);
    const c1 = Color4.from(color1);
    const c2 = Color4.from(color2);
    const stops = Array.from({ length: subdivisions + 2 }, (_, i) => {
        const t = i / (subdivisions + 1);
        const a = easeFn(t);
        return Color4.lerpColors(c1, c2, a).toCSS('hex');
    });
    return stops;
}
//# sourceMappingURL=gradient-stops.js.map