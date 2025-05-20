import { BitArray } from '../../bit-array'
import { hash2 } from './hash'

function findPrimes(count = 1000) {
  const primes: number[] = []
  const isPrime = (n: number) => {
    if (n < 2) return false
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false
    }
    return true
  }
  for (let i = 2; primes.length < count; i++) {
    if (isPrime(i)) {
      primes.push(i)
    }
  }
  return primes
}

function findCollisions(count = 1000) {
  const seen = new Map<number, [number, number]>()
  const collisions: [number, number, number, number][] = []

  for (let x = -1000; x <= 1000; x++) {
    for (let y = -1000; y <= 1000; y++) {
      const h = hash2(x, y)
      const existing = seen.get(h)
      if (existing && (existing[0] !== x || existing[1] !== y)) {
        collisions.push([x, y, existing[0], existing[1]])
        if (collisions.length === count)
          return { collisions, seenCount: seen.size }
      }
      seen.set(h, [x, y])
    }
  }

  return { collisions, seenCount: seen.size }
}

function computeCollisionRatio(method: 'random' | 'sequential' = 'random') {
  const seen = new Map<number, number>()
  let collisionCount = 0
  let totalCount = 0
  let maxCollisionForHash = 0

  const useRandom = method === 'random'
  for (let x = -1000; x < 1000; x++) {
    for (let y = -1000; y < 1000; y++) {
      const h =
        useRandom
          ? hash2(Math.random(), Math.random())
          : hash2(x, y)
      const existing = seen.has(h)
      if (existing) {
        collisionCount++
        const count = seen.get(h)! + 1
        seen.set(h, count)
        if (count > maxCollisionForHash) {
          maxCollisionForHash = count
        }
      } else {
        seen.set(h, 1)
      }
      totalCount++
    }
  }

  return { method, collisionCount, totalCount, collisionRatio: collisionCount / totalCount, maxCollisionForHash }
}

function computeRandomCollision(maxIteration = 1e7) {
  const seen = new Set<number>()
  for (let i = 0; i < maxIteration; i++) {
    const x = 1 / Math.random()
    const y = 1 / Math.random()
    const h = hash2(x, y)
    if (seen.has(h)) {
      return { collision: true, i, x, y, h }
    }
    seen.add(h)
  }
}

// console.log(findCollisions())
// console.log(findPrimes(1000).slice(-20))
// console.log(computeCollisionRatio('random'))
// console.log(computeCollisionRatio('sequential'))
// console.log(computeRandomCollision(1e7))

const bitArray = new BitArray(2 ** 32)
function getExhaustiveCollisions(method: 'random' | 'sequential' = 'random', hash2Fn = hash2) {
  bitArray.clear()
  const side = 4000
  const s2 = side / 2
  const collisions = new Map<number, [number, number][]>()
  let x = 0, y = 0
  const useRandom = method === 'random'
  for (y = -s2; y < s2; y++) {
    for (x = -s2; x < s2; x++) {
      const x2 = useRandom ? 1 / Math.random() : x
      const y2 = useRandom ? 1 / Math.random() : y
      const hash = hash2Fn(x2, y2)
      const index = 2147483648 + hash
      if (bitArray.get(index)) {
        if (!collisions.has(hash)) {
          collisions.set(hash, [])
        }
        collisions.get(hash)!.push([x2, y2])
      }
      bitArray.set(index, true)
    }
  }

  const collisionCount = Array.from(collisions.values()).reduce((acc, v) => acc + v.length, 0)
  const totalCount = side * side
  const collisionRatio = collisionCount / totalCount
  let maxCollisionForHash = 0
  for (const value of collisions.values()) {
    if (value.length > maxCollisionForHash) {
      maxCollisionForHash = value.length
    }
  }

  const now = performance.now()
  {
    let x = 0
    for (let i = 0; i < 10000; i++) {
      x += hash2Fn(1 / Math.random(), i)
    }
  }
  const elapsed = performance.now() - now
  const hashPerMillisecond = Math.floor(10000 / elapsed)

  return {
    method: `${hash2Fn.name}:${method}`,
    elapsed,
    hashPerMillisecond,
    collisionCount,
    totalCount,
    collisionRatio,
    maxCollisionForHash,
  }
}

function getFirstTenCollisions(method: 'random' | 'sequential' = 'random', hash2Fn = hash2) {
  const side = 4000
  const s2 = side / 2
  const map = new Map<number, [number, number][]>()
  const collisions = new Map<number, [number, number][]>()
  let x = 0, y = 0
  const useRandom = method === 'random'
  for (y = -s2; y < s2; y++) {
    for (x = -s2; x < s2; x++) {
      const x2 = useRandom ? 1 / Math.random() : x
      const y2 = useRandom ? 1 / Math.random() : y
      const hash = hash2Fn(x2, y2)
      if (map.has(hash)) {
        const arr = map.get(hash)!
        arr.push([x2, y2])
        collisions.set(hash, arr)
        if (collisions.size > 10) {
          return [...collisions.entries()].map(([hash, [p0, p1]]) => ({ hash, p0, p1 }))
        }
      } else {
        map.set(hash, [[x2, y2]])
      }
    }
  }

  return null
}

console.log(getExhaustiveCollisions('random'))
console.log(getExhaustiveCollisions('sequential'))

// console.log(JSON.stringify({
//   random: getFirstTenCollisions('random'),
//   sequential: getFirstTenCollisions('sequential'),
// }, null, 2))
