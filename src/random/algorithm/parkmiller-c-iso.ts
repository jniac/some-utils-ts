const MAX = 0x7fffffff
const DEFAULT_SEED = 123456

const init = (seedArg: number = DEFAULT_SEED) => {
  if (Number.isNaN(seedArg))
    throw new Error(`NaN is not a valid seed.`)

  let seed = seedArg

  if (Math.abs(seed) < 10)
    seed *= 1000000

  seed = seed % MAX
  seed = seed < 0 ? seed + MAX : seed

  if (seed > 1)
    return seed & MAX

  if (seed === 0)
    return DEFAULT_SEED

  throw new Error(`Impossible. ${seed}`)
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


