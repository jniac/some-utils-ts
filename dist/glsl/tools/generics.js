const types = [
    'float',
    'vec2',
    'vec3',
    'vec4',
];
const options = {
    vecX: ['float', 'vec2', 'vec3', 'vec4'],
};
/**
 * Allows concise generic declaration.
 * Works with code that only require to change the type (eg: "float" by "vec3")
 * and nothing else (no overloads).
 */
export const generics = (typeArg, template) => {
    const chunks = [];
    const types = Array.isArray(typeArg) ? typeArg : [typeArg]
        .map(type => {
        if (type in options) {
            return options[type];
        }
        else {
            return type;
        }
    })
        .flat();
    if (typeof template === 'function') {
        for (const type of types) {
            chunks.push(template(type).replaceAll(/\bT\b/g, type));
        }
    }
    else {
        for (const type of types) {
            chunks.push(template.replaceAll(/\bT\b/g, type));
        }
    }
    return chunks.join('\n');
};
