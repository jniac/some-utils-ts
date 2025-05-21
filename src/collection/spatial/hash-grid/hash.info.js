import clipboard from 'clipboardy'

const PRIME1 = 48271
const PRIME2 = 2246822519
const PRIME3 = 3266489917
const PRIME4 = 668265263
const PRIME5 = 374761393
const PRIME6 = 2654435761

function mix(x, shift = 2, factor = 6329) {
  x = Math.imul(x, factor)
  return (x << shift) | (x >>> (32 - shift))
}

const f64 = new Float64Array(1)
const i32 = new Int32Array(f64.buffer)

export function hash2(x, y) {
  f64[0] = x
  const x1 = i32[0]
  const x2 = i32[1]

  f64[0] = y
  const y1 = i32[0]
  const y2 = i32[1]

  return 0b00010011000111100110001110111101 ^ (
    (mix(x1, 3, PRIME1) ^ mix(x2, 17, PRIME2)) ^
    (mix(y1, 13, PRIME3) ^ mix(y2, 27, PRIME4))
  )
}

export function hash3(x, y, z) {
  // return hash2(hash2(x, y), z) // as fast as this

  f64[0] = x
  const x1 = i32[0]
  const x2 = i32[1]

  f64[0] = y
  const y1 = i32[0]
  const y2 = i32[1]

  f64[0] = z
  const z1 = i32[0]
  const z2 = i32[1]

  return 0b00010011000111100110001110111101 ^ (
    (mix(x1, 3, PRIME1) ^ mix(x2, 17, PRIME2)) ^
    (mix(y1, 13, PRIME3) ^ mix(y2, 27, PRIME4)) ^
    (mix(z1, 5, PRIME5) ^ mix(z2, 19, PRIME6))
  )
}











// INFO
const baseTestCount = 1e7

const bitsPerInt = 32
const bitArray = new class BitArray {
  #buffer
  #view

  get length() {
    return this.#view.length * bitsPerInt
  }

  constructor(count) {
    if (count < 0 || !Number.isInteger(count)) {
      throw new Error('BitArray size must be a non-negative integer')
    }
    const intCount = Math.ceil(count / bitsPerInt)
    this.#buffer = new ArrayBuffer(intCount * 4)
    this.#view = new Int32Array(this.#buffer)
  }

  get(index) {
    if (index < 0 || index >= this.length) {
      throw new RangeError(`Index out of bounds: ${index}`)
    }
    const wordIndex = index >>> 5 // index / 32
    const bitOffset = index & 31 // index % 32
    return (this.#view[wordIndex] & (1 << bitOffset)) !== 0
  }

  set(index, value) {
    if (index < 0 || index >= this.length) {
      throw new RangeError(`Index out of bounds: ${index}`)
    }
    const wordIndex = index >>> 5
    const bitOffset = index & 31
    const mask = 1 << bitOffset

    if (value) {
      this.#view[wordIndex] |= mask // set bit
    } else {
      this.#view[wordIndex] &= ~mask // clear bit
    }
  }

  clear() {
    this.#view.fill(0)
  }
}(2 ** 32)

function getExhaustiveCollisions2(method = 'random', hash = hash2) {
  const side = Math.ceil(baseTestCount ** (1 / 2) / 2) * 2
  const s2 = side / 2
  const offset = 2323
  const min = offset - s2
  const max = offset + s2
  const name = `${hash.name}:${method} (${min}, ${max})`

  console.log(`${name}...`)

  bitArray.clear()
  const collisions = new Map()
  const useRandom = method === 'random'
  let totalCount = 0
  for (let y = min; y < max; y++) {
    for (let x = min; x < max; x++) {
      const x2 = useRandom ? 1 / Math.random() : x
      const y2 = useRandom ? 1 / Math.random() : y
      const h = hash(x2, y2)
      const index = 2147483648 + h
      if (bitArray.get(index)) {
        if (!collisions.has(h)) {
          collisions.set(h, [])
        }
        collisions.get(h).push([x2, y2])
      }
      bitArray.set(index, true)
      totalCount++
    }
  }

  const collisionCount = Array.from(collisions.values()).reduce((acc, v) => acc + v.length, 0)
  const collisionRatio = collisionCount / totalCount
  let maxCollisionForHash_Count = 0
  let maxCollisionForHash_Hash = 0
  for (const [hash, value] of collisions.entries()) {
    if (value.length > maxCollisionForHash_Count) {
      maxCollisionForHash_Count = value.length
      maxCollisionForHash_Hash = hash
    }
  }

  const now = performance.now()
  {
    let x = 0
    for (let i = 0; i < 10000; i++) {
      x += hash(1 / Math.random(), 1 / Math.random())
    }
  }
  const elapsed = performance.now() - now
  const hashPerMillisecond = Math.floor(10000 / elapsed)

  const info = {
    name,
    info: `coll: ${(collisionRatio * 100).toFixed(3)}%, hash: ${hashPerMillisecond} / ms, max: ${maxCollisionForHash_Count}`,
    elapsed,
    hashPerMillisecond,
    collisionCount,
    totalCount,
    collisionRatio,
    maxCollisionForHash: {
      count: maxCollisionForHash_Count,
      hash: maxCollisionForHash_Hash,
    },
  }
  console.log(info)
  return info
}

function getExhaustiveCollisions3(method = 'random', hash = hash3) {
  const side = Math.ceil(baseTestCount ** (1 / 3) / 2) * 2
  const s2 = side / 2
  const offset = 2323
  const min = offset - s2
  const max = offset + s2
  const name = `${hash.name}:${method} (${min}, ${max})`

  console.log(`${name}...`)

  bitArray.clear()
  const collisions = new Map()
  const useRandom = method === 'random'
  let totalCount = 0
  for (let z = min; z < max; z++) {
    for (let y = min; y < max; y++) {
      for (let x = min; x < max; x++) {
        const x2 = useRandom ? 1 / Math.random() : x
        const y2 = useRandom ? 1 / Math.random() : y
        const z2 = useRandom ? 1 / Math.random() : z
        const h = hash(x2, y2, z2)
        const index = 2147483648 + h
        if (bitArray.get(index)) {
          if (!collisions.has(h)) {
            collisions.set(h, [])
          }
          collisions.get(h).push([x2, y2, z2])
        }
        bitArray.set(index, true)
        totalCount++
      }
    }
  }

  const collisionCount = Array.from(collisions.values()).reduce((acc, v) => acc + v.length, 0)
  const collisionRatio = collisionCount / totalCount
  let maxCollisionForHash_Count = 0
  let maxCollisionForHash_Hash = 0
  for (const [hash, value] of collisions.entries()) {
    if (value.length > maxCollisionForHash_Count) {
      maxCollisionForHash_Count = value.length
      maxCollisionForHash_Hash = hash
    }
  }

  const now = performance.now()
  {
    let x = 0
    for (let i = 0; i < 10000; i++) {
      x += hash(1 / Math.random(), 1 / Math.random(), 1 / Math.random())
    }
  }
  const elapsed = performance.now() - now
  const hashPerMillisecond = Math.floor(10000 / elapsed)

  const info = {
    name,
    info: `coll: ${(collisionRatio * 100).toFixed(3)}%, hash: ${hashPerMillisecond} / ms, max: ${maxCollisionForHash_Count}`,
    elapsed,
    hashPerMillisecond,
    collisionCount,
    totalCount,
    collisionRatio,
    maxCollisionForHash: {
      count: maxCollisionForHash_Count,
      hash: maxCollisionForHash_Hash,
    },
  }
  console.log(info)
  return info
}

function getFirstTenCollisions2(method = 'random', hash = hash2) {
  const side = 4000
  const s2 = side / 2
  const map = new Map()
  const collisions = new Map()
  const useRandom = method === 'random'
  for (let y = -s2; y < s2; y++) {
    for (let x = -s2; x < s2; x++) {
      const x2 = useRandom ? 1 / Math.random() : x
      const y2 = useRandom ? 1 / Math.random() : y
      const h = hash(x2, y2)
      if (map.has(h)) {
        const arr = map.get(h)
        arr.push([x2, y2])
        collisions.set(h, arr)
        if (collisions.size > 10) {
          const info = {
            name: `${hash.name}:${method}`,
            // firstTenCollisions: [...collisions.entries()].map(([hash, [p0, p1]]) => ({ hash, p0: `(${p0.join(', ')})`, p1: `(${p1.join(', ')})` }))
            firstTenCollisions: [...collisions.entries()].map(([hash, [p0, p1]]) => ({ hash, p0, p1 }))
          }
          console.log(info)
          return info
        }
      } else {
        map.set(h, [[x2, y2]])
      }
    }
  }

  return null
}

function getFirstTenCollisions3(method = 'random', hash = hash3) {
  const side = 4000
  const s2 = side / 2
  const map = new Map()
  const collisions = new Map()
  const useRandom = method === 'random'
  for (let y = -s2; y < s2; y++) {
    for (let x = -s2; x < s2; x++) {
      for (let z = -s2; z < s2; z++) {
        const x2 = useRandom ? 1 / Math.random() : x
        const y2 = useRandom ? 1 / Math.random() : y
        const z2 = useRandom ? 1 / Math.random() : z
        const h = hash(x2, y2, z2)
        if (map.has(h)) {
          const arr = map.get(h)
          arr.push([x2, y2, z2])
          collisions.set(h, arr)
          if (collisions.size > 10) {
            const info = {
              name: `${hash.name}:${method}`,
              // firstTenCollisions: [...collisions.entries()].map(([hash, [p0, p1]]) => ({ hash, p0: `(${p0.join(', ')})`, p1: `(${p1.join(', ')})` })),
              firstTenCollisions: [...collisions.entries()].map(([hash, [p0, p1]]) => ({ hash, p0, p1 }))
            }
            console.log(info)
            return info
          }
        } else {
          map.set(h, [[x2, y2, z2]])
        }
      }
    }
  }

  return null
}

const json = JSON.stringify({
  random2: getFirstTenCollisions2('random'),
  sequential2: getFirstTenCollisions2('sequential'),
}, null, 2)
clipboard.writeSync(json)

const info = [
  getExhaustiveCollisions3('sequential'),
  getExhaustiveCollisions3('random'),

  getExhaustiveCollisions2('sequential'),
  getExhaustiveCollisions2('random'),

  getFirstTenCollisions3('sequential'),
  getFirstTenCollisions3('random'),

  getFirstTenCollisions2('sequential'),
  getFirstTenCollisions2('random'),
]
