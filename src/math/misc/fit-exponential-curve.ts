import { Vector2Like } from '../../types'

export function fitExponentialCurve(p1: Vector2Like, p2: Vector2Like, p3: Vector2Like) {
  const { x: x1, y: y1 } = p1
  const { x: x2, y: y2 } = p2
  const { x: x3, y: y3 } = p3

  // Function f(C) = 0 to solve
  function f(C: number): number {
    return (
      (x3 - x1) * (Math.log(y2 - C) - Math.log(y1 - C)) -
      (x2 - x1) * (Math.log(y3 - C) - Math.log(y1 - C))
    )
  }

  // ---- Bisection Method to solve for C ----
  // C must be less than min(y1, y2, y3) to avoid log of negative
  const minY = Math.min(y1, y2, y3)
  let low = -1e6 // very low possible value
  let high = minY - 1e-9 // slightly below the smallest y
  let mid = 0
  const tolerance = 1e-9
  const maxIter = 100

  for (let i = 0; i < maxIter; i++) {
    mid = (low + high) / 2
    const val = f(mid)

    if (Math.abs(val) < tolerance) break

    // Change interval depending on sign
    if (f(low) * val < 0) {
      high = mid
    } else {
      low = mid
    }
  }

  const C = mid

  // ---- Solve for B and A ----
  const B = (Math.log(y2 - C) - Math.log(y1 - C)) / (x2 - x1)
  const A = (y1 - C) / Math.exp(B * x1)

  return { A, B, C, equation: (x: number) => A * Math.exp(B * x) + C }
}