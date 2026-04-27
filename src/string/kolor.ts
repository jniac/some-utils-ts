/*
 * ANSI color codes for 16-color terminals. The RGB values are approximate and may vary between implementations.
 *
 * The table includes the standard 8 colors (30-37 for foreground, 40-47 for background) and their bright variants (90-97 for foreground, 100-107 for background).
 *
 * Note: The actual colors displayed may differ based on the terminal emulator and its configuration.
 *
 * References:
 * - https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
 * - https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * - https://en.wikipedia.org/wiki/ANSI_escape_code#24-bit
 */

function withColor(text: string, colorCode: number, resetCode: number = 39): string {
  return `\x1B[${colorCode}m${text}\x1B[${resetCode}m`
}

function make<T extends Record<string, number>>(
  resetCode: number,
  table: T
): Record<keyof T, (text: string) => string> {
  const result: Record<string, (text: string) => string> = {}
  for (const key in table) {
    const colorCode = table[key]
    result[key] = (text: string) => withColor(text, colorCode)
  }
  return result as Record<keyof T, (text: string) => string>
}

export const Kolor = {
  ...make(39, {
    black: 30,
    red: 91,
    green: 92,
    yellow: 93,
    blue: 94,
    magenta: 95,
    cyan: 96,
    white: 97,
    brightBlack: 90,
    brightRed: 91,
    brightGreen: 92,
    brightYellow: 93,
    brightBlue: 94,
    brightMagenta: 95,
    brightCyan: 96,
    brightWhite: 97
  }),

  bg: make(49, {
    black: 40,
    red: 101,
    green: 102,
    yellow: 103,
    blue: 104,
    magenta: 105,
    cyan: 106,
    white: 107,
    brightBlack: 100,
    brightRed: 101,
    brightGreen: 102,
    brightYellow: 103,
    brightBlue: 104,
    brightMagenta: 105,
    brightCyan: 106,
    brightWhite: 107
  })
}