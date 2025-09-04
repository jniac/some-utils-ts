export function dedent(str: string): string {
  const lines = str.replace(/^\n/, '').split('\n')
  const indent = Math.min(
    ...lines.filter(l => l.trim()).map(l => l.match(/^(\s*)/)![1].length)
  )
  return lines.map(l => l.slice(indent)).join('\n').trim()
}
