
export function* range(count: number) {
  const out = { i: 0, count }
  for (let i = 0; i < count; i++) {
    out.i = i
    yield out
  }
}
