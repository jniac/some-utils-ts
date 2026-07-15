

const defaultOptions = {
  removePaddingEmptyLines: true,
} as const

/**
 * Removes leading indentation from a multi-line string.
 *
 * Example:
 * ```ts
 * const str = dedent`
 *     👉 NOTICE 👈
 * 
 *   This is a multi-line string.
 *   It has leading indentation that will be removed.
 * 
 *   Features:
 *     - It preserves relative indentation.
 *     - It preserves empty lines.
 *     - Deduces the minimum indentation across all lines (not only the first one).
 *     - It can be used as a template literal tag or as a function.
 * `
 * console.log(str)
 * ```
 */
export function dedent(strings: TemplateStringsArray, ...values: unknown[]): string
export function dedent(str: string, options?: Partial<typeof defaultOptions>): string
export function dedent(...args: any[]): string {
  let str: string
  let removePaddingEmptyLines = defaultOptions.removePaddingEmptyLines
  if (typeof args[0] === 'string') {
    str = args[0]
    if (args[1]?.removePaddingEmptyLines !== undefined)
      removePaddingEmptyLines = args[1].removePaddingEmptyLines
  } else {
    const strings: TemplateStringsArray = args[0]
    const values: unknown[] = args.slice(1)
    str = strings.reduce((acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ''), '')
  }

  const lines = str.split('\n')
  let indent = 0
  while (removePaddingEmptyLines && lines.length > 0 && lines[0].trim() === '')
    lines.shift()
  while (removePaddingEmptyLines && lines.length > 0 && lines[lines.length - 1].trim() === '')
    lines.pop()
  for (const line of lines) {
    const match = line.match(/^(\s*)\S/)
    if (match) {
      const indentNew = match[1].length
      if (indent === 0 || indentNew < indent)
        indent = indentNew
    }
  }
  return lines.map(l => l.slice(Math.min(l.length, indent))).join('\n')
}
