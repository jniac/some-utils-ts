export function triangle(x: number, { frequency = 1, phase = 0 } = {}) {
  let x1 = x * frequency + phase
  let y = x1 * 2 - Math.floor(x1 * 2)
  return (
    x1 - Math.floor(x1) < 0.5
      ? y
      : 1 - y
  )
}

export const waveform = {
  triangle,
}
