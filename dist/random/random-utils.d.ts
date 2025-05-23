import { Vector2Like, Vector3Like } from '../types';
type SetRandomParameters = [random?: (() => number) | 'parkmiller', seed?: number];
type RandomUtilsType = {
    /**
     * Sets the random function to use. By default, Math.random is used but you can
     * set it to a custom function or the 'parkmiller' algorithm.
     */
    setRandom: (...args: SetRandomParameters) => RandomUtilsType;
    /**
     * By default, the random function is Math.random, so seed() will have no effect.
     * If you set the random function to 'parkmiller', it will use the Park-Miller
     * algorithm with the given seed, resetting the state of the generator.
     * @param seed - The seed for the random number generator.
     */
    seed: (seed?: number | 'reset') => RandomUtilsType;
    /**
     * Creates a new instance of RandomUtils. This is useful if you want to create
     * multiple independent random number generators.
     * @returns A new instance of RandomUtils.
     */
    new: (...args: SetRandomParameters) => RandomUtilsType;
    /**
     * Returns a random number between 0 and 1 using the current random function.
     *
     * Same signature as Math.random and can be used as a replacement.
     *
     * For more options, use the number() method.
     *
     * @returns A random number between 0 and 1.
     */
    random: () => number;
    /**
     * Generates a random number between 0 and 1, or between min and max if provided.
     */
    number(): number;
    number(max: number): number;
    number(min: number, max: number): number;
    /**
     * Generates a random hex color string in the format '#RRGGBB'.
     * @returns A random hex color string.
     */
    hexColor(): string;
    /**
     * Generates a random integer between 0 and max, or between min and max if provided.
     * Note: The max value is exclusive.
     * @param min - The minimum value (inclusive).
     * @param max - The maximum value (exclusive).
     * @returns A random integer between min and max.
     */
    int(max: number): number;
    int(min: number, max: number): number;
    /**
     * Picks a random index from an array of weights based on their relative probabilities.
     * @param weights - An array of weights.
     * @returns A random index based on the weights.
     */
    pickIndex: (weights: number[]) => number;
    /**
     * Picks a random element from an array, optionally weighted by the provided weights.
     * @param array - The array to pick from.
     * @param weights - An optional array of weights corresponding to the elements in the array.
     * @returns A random element from the array.
     * @throws Error if the array is empty.
     * @throws Error if the weights array does not match the length of the array.
     * @example
     * const randomElement = RandomUtils.pick(['apple', 'banana', 'cherry'], [1, 3, 6])
     * console.log(randomElement) // Randomly picks 'apple', 'banana', or 'cherry' based on weights
     */
    pick: <T>(array: T[], weights?: number[]) => T;
    direction2: <T extends Vector2Like>(out?: T) => T;
    direction3: <T extends Vector3Like>(out?: T) => T;
};
/**
 * Agnostic random utility module.
 *
 * RandomUtils is an agnostic utility module wrapped around a random function
 * (Math.random by default) that helps to use random numbers in common situations
 * (like generating random numbers in a range, picking an item in a list with weight
 * considerations, etc.)
 *
 * Why?
 * - Because we want a solution that can use any random function, not just Math.random,
 *   neither we want to be tied to a specific implementation.
 * - Instead of using a specific random function, the module focuses on the
 *   sometimes complex logic and painful details of using random numbers in a
 *   consistent way.
 */
export declare const RandomUtils: RandomUtilsType;
export {};
//# sourceMappingURL=random-utils.d.ts.map