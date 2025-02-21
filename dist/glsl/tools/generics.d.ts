declare const types: readonly ["float", "vec2", "vec3", "vec4"];
type Type = (typeof types)[number];
declare const options: {
    vecX: string[];
};
type TypeArg = Type | keyof typeof options;
/**
 * Allows concise generic declaration.
 * Works with code that only require to change the type (eg: "float" by "vec3")
 * and nothing else (no overloads).
 */
export declare const generics: (typeArg: TypeArg | TypeArg[], template: string | ((type: string) => string)) => string;
export {};
