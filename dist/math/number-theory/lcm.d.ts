/**
 * Returns the gGreatest Common Divisor (GCD) of two numbers.
 * The GCD is calculated using the Euclidean algorithm.
 *
 * @param a - First number
 * @param b - Second number
 * @returns The greatest common divisor of a and b
 */
export declare function gcd(a: number, b: number): number;
/**
 * Returns the Least Common Multiple (LCM) of two numbers.
 * The LCM is calculated using the formula: lcm(a, b) = (a * b) / gcd(a, b)
 *
 * @param a - First number
 * @param b - Second number
 * @returns The least common multiple of a and b
 */
export declare function lcm(a: number, b: number): number;
export declare function bruteForceLcm(...numbers: number[]): number;
