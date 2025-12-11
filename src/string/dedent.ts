
/**
 * Removes leading indentation from a multi-line string.
 *
 * It detects the minimum indentation level from the *first* non-empty line
 * and removes that amount of leading whitespace from all lines.
 */
export function dedent(str: string, { removePaddingEmptyLines = true } = {}): string {
  const lines = str.split('\n')
  let indent = 0
  while (removePaddingEmptyLines && lines.length > 0 && lines[0].trim() === '')
    lines.shift()
  while (removePaddingEmptyLines && lines.length > 0 && lines[lines.length - 1].trim() === '')
    lines.pop()
  for (const line of lines) {
    const match = line.match(/^(\s*)\S/)
    if (match) {
      indent = match[1].length
      break
    }
  }
  return lines.map(l => l.slice(Math.min(l.length, indent))).join('\n')
}
