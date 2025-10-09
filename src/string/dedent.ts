
/**
 * Removes leading indentation from a multi-line string.
 *
 * It detects the minimum indentation level from the *first* non-empty line
 * and removes that amount of leading whitespace from all lines.
 */
export function dedent(str: string): string {
  const lines = str.split('\n')
  let indent = 0
  for (const line of lines) {
    const match = line.match(/^(\s*)\S/)
    if (match) {
      indent = match[1].length
      break
    }
  }
  return lines.map(l => l.slice(Math.min(l.length, indent))).join('\n')
}
