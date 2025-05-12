import { EaseDeclaration } from '../animation/easing';
import { ColorDeclaration } from '../math/color';
declare const defaultOptions: {
    ease: EaseDeclaration;
    subdivisions: number;
};
type Options = Partial<typeof defaultOptions>;
/**
 * Because linear interpolated gradient are awfull compared to eased ones.
 */
export declare function createGradientStops(color1: ColorDeclaration, color2: ColorDeclaration, options?: Options): string[];
export {};
//# sourceMappingURL=gradient-stops.d.ts.map