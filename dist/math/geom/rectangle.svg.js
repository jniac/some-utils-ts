import { formatNumber } from '../../string/number.js';
let scope;
export class SvgUtils {
    static setScope(rectangle) {
        scope = rectangle;
        return SvgUtils;
    }
    static toViewBox({ scalar = 1 } = {}) {
        const [x, y, width, height] = scope.tupple(scalar);
        return `${formatNumber(x)} ${formatNumber(y)} ${formatNumber(width)} ${formatNumber(height)}`;
    }
    static toPathData({ scalar = 1, reversed = false } = {}) {
        const [x, y, width, height] = scope.tupple(scalar);
        return reversed
            ? `M ${x},${y} v ${height} h ${width} v ${-height} Z`
            : `M ${x},${y} h ${width} v ${height} h ${-width} Z`;
    }
    static toRectProps({ scalar = 1 } = {}) {
        const [x, y, width, height] = scope.tupple(scalar);
        return `x="${formatNumber(x)}" y="${formatNumber(y)}" width="${formatNumber(width)}" height="${formatNumber(height)}"`;
    }
}
//# sourceMappingURL=rectangle.svg.js.map