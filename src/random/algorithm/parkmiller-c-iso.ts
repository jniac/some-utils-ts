const MAX = 0x7fffffff
const DEFAULT_SEED = 123456

const init = (seed: number = DEFAULT_SEED) => {
  // Trying to avoid low randomness for low seeds
  seed = seed * 7 + Math.sqrt(seed) + Math.sin(seed) * 16087

  seed = seed % MAX
  seed = seed < 0 ? seed + MAX : seed
  if (seed > 1) {
    return seed & MAX
  }
  if (seed === 0) {
    return 345678
  }
  return DEFAULT_SEED
}

const next = (state: number) => {
  state = Math.imul(state, 48271)
  state &= MAX
  return state
}

const map = (n: number) => (n - 1) / (MAX - 1)

export {
  DEFAULT_SEED,
  MAX,
  init,
  map,
  next
}

