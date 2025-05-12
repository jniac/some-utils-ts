import { Rectangle } from './rectangle';
export declare class SvgUtils {
    static setScope(rectangle: Rectangle): typeof SvgUtils;
    static toViewBox({ scalar }?: {
        scalar?: number | undefined;
    }): string;
    static toPathData({ scalar, reversed }?: {
        scalar?: number | undefined;
        reversed?: boolean | undefined;
    }): string;
    static toRectProps({ scalar }?: {
        scalar?: number | undefined;
    }): string;
}
//# sourceMappingURL=rectangle.svg.d.ts.map