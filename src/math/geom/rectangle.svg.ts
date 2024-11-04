import { formatNumber } from '../../string/number'
import { Rectangle } from './rectangle'

let scope: Rectangle

export class SvgUtils {
  static setScope(rectangle: Rectangle): typeof SvgUtils {
    scope = rectangle
    return SvgUtils
  }

  static toViewBox({ scalar = 1 } = {}): string {
    const [x, y, width, height] = scope.tupple(scalar)
    return `${formatNumber(x)} ${formatNumber(y)} ${formatNumber(width)} ${formatNumber(height)}`
  }

  static toPathData({ scalar = 1, reversed = false } = {}): string {
    const [x, y, width, height] = scope.tupple(scalar)
    return reversed
      ? `M ${x},${y} v ${height} h ${width} v ${-height} Z`
      : `M ${x},${y} h ${width} v ${height} h ${-width} Z`
  }
}
