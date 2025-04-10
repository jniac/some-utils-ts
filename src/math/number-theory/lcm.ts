/**
 * Returns the gGreatest Common Divisor (GCD) of two numbers.
 * The GCD is calculated using the Euclidean algorithm.
 * 
 * @param a - First number
 * @param b - Second number
 * @returns The greatest common divisor of a and b
 */
export function gcd(a: number, b: number): number {
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

/**
 * Returns the Least Common Multiple (LCM) of two numbers.
 * The LCM is calculated using the formula: lcm(a, b) = (a * b) / gcd(a, b)
 *
 * @param a - First number
 * @param b - Second number
 * @returns The least common multiple of a and b
 */
export function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b)
}

export function bruteForceLcm(...numbers: number[]): number {
  let x = 1
  const bases = numbers.map(n => {
    const b = x
    x *= n
    return b
  })

  const set = new Set()
  const max = 1e9
  const c = numbers.length
  let i = -1
  while (++i < max) {
    let x = 0
    for (let b = 0; b < c; b++) {
      const n = numbers[b]
      x += bases[b] * (i % n)
    }
    if (set.has(x))
      break
    set.add(x)
  }

  if (i === max)
    throw new Error('Lcm brute force failed')

  return i
}