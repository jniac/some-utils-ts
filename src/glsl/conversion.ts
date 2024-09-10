import { toff } from '../math/basic'

type Vec3Declaration =
  | string
  | number
  | [number, number, number]
  | { x: number, y: number, z: number }
  | { r: number, g: number, b: number }

/**
 * Convenient function to convert a color (or a vector 3) to a vec3 string.
 */
export function vec3(arg: Vec3Declaration, {
  precision = 3,
} = {}) {
  let x = 0, y = 0, z = 0
  function toString() {
    return `vec3(${x.toFixed(precision)}, ${y.toFixed(precision)}, ${z.toFixed(precision)})`
  }
  switch (typeof arg) {
    case 'number': {
      x = ((arg >> 16) & 0xff) / 0xff
      y = ((arg >> 8) & 0xff) / 0xff
      z = (arg & 0xff) / 0xff
      return toString()
    }
    case 'string': {
      if (arg.startsWith('#')) {
        if (arg.length === 4) {
          x = parseInt(arg[1] + arg[1], 16) / 0xff
          y = parseInt(arg[2] + arg[2], 16) / 0xff
          z = parseInt(arg[3] + arg[3], 16) / 0xff
          return toString()
        }
        const hex = parseInt(arg.slice(1), 16)
        return vec3(hex, { precision })
      }
      throw new Error(`Invalid string: ${arg}`)
    }
    case 'object': {
      if (Array.isArray(arg)) {
        [x, y, z] = arg
        return toString()
      }
      if ('r' in arg) {
        x = arg.r
        y = arg.g
        z = arg.b
        return toString()
      }
      if ('x' in arg) {
        x = arg.x
        y = arg.y
        z = arg.z
        return toString()
      }
      throw new Error(`Invalid object: ${arg}`)
    }
  }

  return 'vec3(1.0, 0.0, 1.0)'
}
toff