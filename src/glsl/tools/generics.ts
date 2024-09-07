const types = [
  'float',
  'vec2',
  'vec3',
  'vec4',
] as const

type Type = (typeof types)[number]

const options = {
  vecX: ['float', 'vec2', 'vec3', 'vec4'],
}

type TypeArg = Type | keyof typeof options

/**
 * Allows concise generic declaration.
 * Works with code that only require to change the type (eg: "float" by "vec3") 
 * and nothing else (no overloads).
 */
export const generics = (typeArg: TypeArg | TypeArg[], template: string) => {
  const chunks = [] as string[]
  const types = Array.isArray(typeArg) ? typeArg : [typeArg]
      .map(type => {
      if (type in options) {
        return options[type as keyof typeof options]
      } else {
        return type
      }
    })
    .flat()
  for (const type of types) {
    chunks.push(template.replaceAll(/\bT\b/g, type))
  }
  return chunks.join('\n')
}
