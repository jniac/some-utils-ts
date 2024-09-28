import { deepSet } from './deep'
import { deepDiff } from './diff'

/**
 * Deep tests.
 * 
 * - deepSet ~80% ok
 * - deepDiff ~80% ok
 * - deepClone: not tested
 * - etc.
 */
export function test() {
  type Testbed = {
    name: string
    test: () => Generator<string>
    assertions: string[]
  }
  const testbeds: Testbed[] = []
  const newTestbed = (name: string, test: () => Generator<string>) => testbeds.push({ name, test, assertions: [] })
  function assert(condition: boolean, message: string) {
    const testbed = testbeds[testbeds.length - 1]
    if (condition) {
      return message
    }
    throw new Error(`Assertion failed: ${message}`)
  }

  // 0.
  newTestbed('deepSet', function* () {
    const a = {
      x: {
        y: {
          z: 1,
        },
      },
    }

    deepSet(a, 'x.y.z', 2)
    yield assert(a.x.y.z === 2, 'a.x.y.z === 2')

    deepSet(a, ['x', 'y', 'z'], 3)
    yield assert(a.x.y.z === 3, 'a.x.y.z === 3')

    deepSet(a, 'x', null)
    deepSet(a, 'x.y.z', 2)
    yield assert(a.x.y.z === 2, 'a.x.y.z === 3 (pierce through null values)')

    deepSet(a, 'x', null)
    const r = deepSet(a, 'x.y.z', 2, { pierceNullOrUndefined: false })
    yield assert(r.success === false, 'r.success === false (pierceNullOrUndefined: false)')
    yield assert(a.x === null, 'a.x === null (pierceNullOrUndefined: false)')
  })

  // 1. 
  newTestbed('deepSet: number, symbol', function* () {
    {
      const obj = {} as any
      deepSet(obj, ['x', 'y', 0], 1)
      yield assert(Array.isArray(obj.x.y), 'Array.isArray(obj.x.y)')
    }
    {
      const obj = {} as any
      deepSet(obj, ['x', 2, 0], 1)
      yield assert(Array.isArray(obj.x), 'Array.isArray(obj.x.y)')
      yield assert(obj.x.length === 3, 'obj.x.length === 3')
      yield assert(Array.isArray(obj.x[2]), 'Array.isArray(obj.x[2])')
    }
    {
      const arr: any[] = [[0, 1]]
      deepSet(arr, [0, 2, 0], 1)
      yield assert(Array.isArray(arr[0]), 'Array.isArray(arr[0])')
    }
    {
      const obj = {} as any
      const mySymbol = Symbol('mySymbol')
      deepSet(obj, ['x', mySymbol, 2], 1)
      yield assert(obj.x[mySymbol] instanceof Array, 'obj.x[mySymbol] instanceof Array')
    }
  })

  // 2.
  newTestbed('deepDiff', function* () {
    const a = {
      x: 1,
      y: 2,
      z: {
        a: 3,
        b: 4,
        c: {
          d: 5,
          e: 6,
        },
      },
      r: 7,
    }
    const b = {
      x: 1,
      y: 2,
      z: {
        a: 3,
        b: 4,
        c: {
          d: 5,
          e: 7, // Changed.
        },
      },
      // r: 7, // Removed.
      q: 8, // Added.
    }

    const diff = deepDiff(a, b)

    yield assert(diff.a.r === 7, 'diff.a.r === 7 (removed)')
    // @ts-ignore - r is removed.
    yield assert(diff.b.r === undefined, 'diff.b.r === undefined (removed)')

    yield assert(diff.b.q === 8, 'diff.b.q === 8 (added)')
    // @ts-ignore - q is added.
    yield assert(diff.a.q === undefined, 'diff.a.q === undefined (added)')

    yield assert(diff.a?.z?.c?.e === 6, 'diff.a.z.c.e === 6 (changed)')
    yield assert(diff.b?.z?.c?.e === 7, 'diff.b.z.c.e === 7 (changed)')
  })

  for (const testbed of testbeds) {
    for (const assertion of testbed.test()) {
      testbed.assertions.push(assertion)
    }
  }

  const totalAssertions = testbeds.reduce((acc, testbed) => acc + testbed.assertions.length, 0)
  const lines = testbeds.map((testbed, i) => `  ${i}. ${testbed.name}: ${testbed.assertions.length}`).join('\n')
  const str = `deep.test.ts success (${testbeds.length}:${totalAssertions})\n${lines}`
  console.log(`%c${str}`, 'color: #6f9')
}
