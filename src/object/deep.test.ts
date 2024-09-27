import { deepDiff, deepSet } from './deep'

export function test() {
  const testbed: (() => void)[] = []
  const assertions: string[] = []
  function assert(condition: boolean, message: string) {
    if (condition) {
      assertions.push(message)
    }
    console.assert(condition, message)
  }

  testbed.push(function deepSetTest1() {
    const a = {
      x: {
        y: {
          z: 1,
        },
      },
    }

    deepSet(a, 'x.y.z', 2)
    assert(a.x.y.z === 2, 'a.x.y.z === 2')

    deepSet(a, ['x', 'y', 'z'], 3)
    assert(a.x.y.z === 3, 'a.x.y.z === 3')

    deepSet(a, 'x', null)
    deepSet(a, 'x.y.z', 2)
    assert(a.x.y.z === 2, 'a.x.y.z === 3 (pierce through null values)')

    deepSet(a, 'x', null)
    const r = deepSet(a, 'x.y.z', 2, { pierceNullOrUndefined: false })
    assert(r.success === false, 'r.success === false (pierceNullOrUndefined: false)')
    assert(a.x === null, 'a.x === null (pierceNullOrUndefined: false)')
  })

  testbed.push(function diffTest1() {
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

    assert(diff.a.r === 7, 'diff.a.r === 7 (removed)')
    // @ts-ignore - r is removed.
    assert(diff.b.r === undefined, 'diff.b.r === undefined (removed)')

    assert(diff.b.q === 8, 'diff.b.q === 8 (added)')
    // @ts-ignore - q is added.
    assert(diff.a.q === undefined, 'diff.a.q === undefined (added)')

    assert(diff.a?.z?.c?.e === 6, 'diff.a.z.c.e === 6 (changed)')
    assert(diff.b?.z?.c?.e === 7, 'diff.b.z.c.e === 7 (changed)')
  })

  for (const test of testbed) {
    test()
  }

  console.log(`Success\n- test: ${testbed.length}\n- assertions: ${assertions.length}`)
}
