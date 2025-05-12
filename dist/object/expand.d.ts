/**
 * Turns an "compressed" object into a regular one.
 *
 * Turns
 * ```
 * { 'foo.bar.x|y|z.value': 2 }
 * ```
 * into
 * ```
 * {
 *   foo: {
 *     bar: {
 *       x: { value: 2 },
 *       y: { value: 2 },
 *       z: { value: 2 },
 *     },
 *   },
 * }
 * ```
 */
export declare function expandObject(obj: Record<string, any>): Record<string, any>;
//# sourceMappingURL=expand.d.ts.map