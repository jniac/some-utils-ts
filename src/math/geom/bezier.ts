import { Vector2Like, Vector3Like } from '../../types'

function bezierQuadratic(t: number) {
  return [
    (1 - t) ** 2,
    2 * (1 - t) * t,
    t ** 2,
  ]
}

function bezierCubic(t: number) {
  const t2 = t * t
  const t3 = t2 * t
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  return [
    mt3,
    3 * mt2 * t,
    3 * mt * t2,
    t3,
  ]
}

function bezierQuartic(t: number) {
  const t2 = t * t
  const t3 = t2 * t
  const t4 = t3 * t
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  const mt4 = mt3 * mt
  return [
    mt4,
    4 * mt3 * t,
    6 * mt2 * t2,
    4 * mt * t3,
    t4,
  ]
}

function bezierQuintic(t: number) {
  const t2 = t * t
  const t3 = t2 * t
  const t4 = t3 * t
  const t5 = t4 * t
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  const mt4 = mt3 * mt
  const mt5 = mt4 * mt
  return [
    mt5,
    5 * mt4 * t,
    10 * mt3 * t2,
    10 * mt2 * t3,
    5 * mt * t4,
    t5,
  ]
}

function binomial(n: number, k: number) {
  let result = 1
  for (let i = 1; i <= k; i++) {
    result *= (n - i + 1) / i
  }
  return result
}

function bezierN(t: number, n: number) {
  const result = new Array(n + 1).fill(0)
  for (let i = 0; i <= n; i++) {
    result[i] = binomial(n, i) * (1 - t) ** (n - i) * t ** i
  }
  return result
}

export function bezier2<T extends Vector2Like>(points: T[], t: number, out?: T): T {
  out ??= { x: 0, y: 0 } as T
  switch (points.length) {
    case 3: {
      const [p0, p1, p2] = points
      const [w0, w1, w2] = bezierQuadratic(t)
      out.x = p0.x * w0 + p1.x * w1 + p2.x * w2
      out.y = p0.y * w0 + p1.y * w1 + p2.y * w2
      break
    }
    case 4: {
      const [p0, p1, p2, p3] = points
      const [w0, w1, w2, w3] = bezierCubic(t)
      out.x = p0.x * w0 + p1.x * w1 + p2.x * w2 + p3.x * w3
      out.y = p0.y * w0 + p1.y * w1 + p2.y * w2 + p3.y * w3
      break
    }
    case 5: {
      const [p0, p1, p2, p3, p4] = points
      const [w0, w1, w2, w3, w4] = bezierQuartic(t)
      out.x = p0.x * w0 + p1.x * w1 + p2.x * w2 + p3.x * w3 + p4.x * w4
      out.y = p0.y * w0 + p1.y * w1 + p2.y * w2 + p3.y * w3 + p4.y * w4
      break
    }
    case 6: {
      const [p0, p1, p2, p3, p4, p5] = points
      const [w0, w1, w2, w3, w4, w5] = bezierQuintic(t)
      out.x = p0.x * w0 + p1.x * w1 + p2.x * w2 + p3.x * w3 + p4.x * w4 + p5.x * w5
      out.y = p0.y * w0 + p1.y * w1 + p2.y * w2 + p3.y * w3 + p4.y * w4 + p5.y * w5
      break
    }
    default: {
      const n = points.length - 1
      const weights = bezierN(t, n)
      out.x = 0
      out.y = 0
      for (let i = 0; i <= n; i++) {
        out.x += points[i].x * weights[i]
        out.y += points[i].y * weights[i]
      }
    }
  }
  return out
}

export function bezier3<T extends Vector3Like>(points: T[], t: number, out?: T): T {
  out ??= { x: 0, y: 0, z: 0 } as T
  switch (points.length) {
    case 3: {
      const [p0, p1, p2] = points
      const [w0, w1, w2] = bezierQuadratic(t)
      out.x = p0.x * w0 + p1.x * w1 + p2.x * w2
      out.y = p0.y * w0 + p1.y * w1 + p2.y * w2
      out.z = p0.z * w0 + p1.z * w1 + p2.z * w2
      break
    }
    case 4: {
      const [p0, p1, p2, p3] = points
      const [w0, w1, w2, w3] = bezierCubic(t)
      out.x = p0.x * w0 + p1.x * w1 + p2.x * w2 + p3.x * w3
      out.y = p0.y * w0 + p1.y * w1 + p2.y * w2 + p3.y * w3
      out.z = p0.z * w0 + p1.z * w1 + p2.z * w2 + p3.z * w3
      break
    }
    case 5: {
      const [p0, p1, p2, p3, p4] = points
      const [w0, w1, w2, w3, w4] = bezierQuartic(t)
      out.x = p0.x * w0 + p1.x * w1 + p2.x * w2 + p3.x * w3 + p4.x * w4
      out.y = p0.y * w0 + p1.y * w1 + p2.y * w2 + p3.y * w3 + p4.y * w4
      out.z = p0.z * w0 + p1.z * w1 + p2.z * w2 + p3.z * w3 + p4.z * w4
      break
    }
    case 6: {
      const [p0, p1, p2, p3, p4, p5] = points
      const [w0, w1, w2, w3, w4, w5] = bezierQuintic(t)
      out.x = p0.x * w0 + p1.x * w1 + p2.x * w2 + p3.x * w3 + p4.x * w4 + p5.x * w5
      out.y = p0.y * w0 + p1.y * w1 + p2.y * w2 + p3.y * w3 + p4.y * w4 + p5.y * w5
      out.z = p0.z * w0 + p1.z * w1 + p2.z * w2 + p3.z * w3 + p4.z * w4 + p5.z * w5
      break
    }
    default: {
      const n = points.length - 1
      const weights = bezierN(t, n)
      out.x = 0
      out.y = 0
      out.z = 0
      for (let i = 0; i <= n; i++) {
        out.x += points[i].x * weights[i]
        out.y += points[i].y * weights[i]
        out.z += points[i].z * weights[i]
      }
      break
    }
  }
  return out
}

/**
 * Returns Cubic Bezier control points for an arc.
 * https://pomax.github.io/bezierinfo/#circles
 */
export function cubicBezierArcControlPoints<T extends Vector2Like>(
  center: Vector2Like,
  radius: number,
  start: number,
  end: number,
  tension = 1,
  out?: T[],
): T[] {
  out ??= [
    { x: 0, y: 0 } as T,
    { x: 0, y: 0 } as T,
    { x: 0, y: 0 } as T,
    { x: 0, y: 0 } as T,
  ]
  const { x, y } = center
  const [p0, p1, p2, p3] = out
  const cs = Math.cos(start)
  const ss = Math.sin(start)
  const ce = Math.cos(end)
  const se = Math.sin(end)
  const k = 4 / 3 * Math.tan((end - start) / 4) * tension
  p0.x = x + radius * cs
  p0.y = y + radius * ss
  p1.x = x + radius * (cs - ss * k)
  p1.y = y + radius * (ss + cs * k)
  p2.x = x + radius * (ce + se * k)
  p2.y = y + radius * (se - ce * k)
  p3.x = x + radius * ce
  p3.y = y + radius * se
  return out
}
