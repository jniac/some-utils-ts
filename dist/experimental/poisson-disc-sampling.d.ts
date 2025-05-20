import { Vector2Declaration } from '../declaration';
import { Vector2Like } from '../types';
declare const defaultProps: {
    /**
     * The minimum distance between samples.
     * @default 1
     */
    radius: number;
    /**
     * The maximum distance between samples.
     * @default 1
     */
    radiusRatioMax: number;
    /**
     * The maximum number of samples to generate.
     * @default 1000
     */
    maxCount: number;
    /**
     * The random function to use. By default, Math.random is used.
     * @default Math.random
     */
    random: () => number;
    /**
     * The starting point (included in the samples).
     * @default [0, 0]
     */
    start: Vector2Declaration;
    /**
     * A delegate function to check if a sample is valid (e.g. inside a polygon).
     */
    isValid: (x: number, y: number) => boolean;
    /**
     * The maximum number of attempts to find a valid sample.
     * @default 23
     */
    maxAttempts: number;
};
export declare function generatePoissonDiscSamples2(props?: Partial<typeof defaultProps>): Vector2Like[];
export {};
//# sourceMappingURL=poisson-disc-sampling.d.ts.map