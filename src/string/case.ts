
/**
 * Returns tokens from a string with some camelcase in it.
 * 
 * From:
 * ```
 * "setInnerHTMLPropsX Under the Sea"
 * ```
 * it will returns:
 * ```
 * ['set', 'Inner', 'HTML', 'Props', 'X ', 'Under', 'the', 'Sea']
 * ``` 
 */
export function splitCamelcase(str: string): string[] {
  const tokens: string[] = []
  const length = str.length
  let index = 0
  let previousIndex = 0
  let previousCharBreak = false
  while (index < length) {
    const char = str[index]
    const whitespace = /\s/.test(char)
    const charBreak = char === char.toUpperCase()
    if (index > previousIndex + 1) {
      const willBreak = charBreak && !previousCharBreak
      const newWordStarted = (
        charBreak === false
        && previousCharBreak)
      if (whitespace) {
        if (index > previousIndex + 1) {
          tokens.push(str.slice(previousIndex, index))
        }
        index++
        previousIndex = index
      } else if (willBreak) {
        tokens.push(str.slice(previousIndex, index))
        previousIndex = index
      } else if (newWordStarted) {
        tokens.push(str.slice(previousIndex, index - 1))
        previousIndex = index - 1
      }
    }
    previousCharBreak = charBreak
    index++
  }
  tokens.push(str.slice(previousIndex))
  return tokens
}
