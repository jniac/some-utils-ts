
/**
 * A utility function to create inline styles for template literals. It trims the string and replaces newlines with spaces.
 * 
 * Usage:
 * ```tsx
 * const className = inline`
 *   px-4 py-2
 *   text-white
 *   bg-[#fff2]
 * `
 * ```
 * 
 * To be used sparingly...
 */
export function inline(strings: TemplateStringsArray, ...values: unknown[]) {
  const str = String.raw(strings, ...values)
  return str
    .trim()
    .replace(/\s*\n\s*/g, ' ')
}
