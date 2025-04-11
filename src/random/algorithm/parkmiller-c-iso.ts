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

/**
 * Wrapper function to get a random number between 0 and 1.
 * @param seed The seed for the random number generator.
 * @returns A function that returns a random number between 0 and 1.
 * @example
 * const random = getRandom(123)
 * console.log(random()) // 0.123456789
 */
const getRandom = (seed: number = DEFAULT_SEED): () => number => {
  let state = init(seed)
  return () => {
    state = next(state)
    return map(state)
  }
}

export {
  DEFAULT_SEED,
  MAX
}

export {
  init,
  map,
  next
}

export {
  getRandom
}


