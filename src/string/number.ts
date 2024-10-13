
export function removeTrailingZeros(str: string): string {
  const [i, f] = str.split('.')
  if (f === undefined) {
    return i
  }
  let index = f.length - 1
  while (f[index] === '0') {
    index--
  }
  if (f[index] === '.') {
    index--
  }
  return index === -1 ? i : i + '.' + f.slice(0, index + 1)
}

export function formatNumber(n: number, {
  maxDigits = 8,
} = {}): string {
  if (maxDigits < 6) {
    throw new Error('maxDigits must be at least 6')
  }

  if (n === 0) {
    return '0'
  }

  const str = n.toString()
  const [i, f] = str.split('.')
  const ilen = i.length
  let flen = maxDigits - ilen - 1

  const usePrecision =
    ilen > maxDigits ||
    flen < 0
  if (usePrecision) {
    let [b, e] = n.toPrecision(maxDigits).split('e')
    b = b.slice(0, maxDigits - e.length - 1)
    return `${removeTrailingZeros(b)}e${e}`
  }

  const useExpontential =
    Math.abs(n) < 1 / Math.pow(10, maxDigits - 2)
  if (useExpontential) {
    return removeTrailingZeros(n.toExponential(maxDigits - 5))
  }

  if (f === undefined) {
    return i
  }

  return removeTrailingZeros(n.toFixed(flen))
}

export function formatBigNumber(n: number, {
  thousandsSeparator = ',',
} = {}) {
  const str = n.toFixed(0)
  const parts = [] as string[]
  let i = str.length
  while (i > 0) {
    const start = Math.max(0, i - 3)
    parts.unshift(str.slice(start, i))
    i = start
  }
  return parts.join(thousandsSeparator)
}