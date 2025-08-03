import { describe, expect, test } from 'vitest'
import { promisify, promisifySymbol } from './promisify'

function hasAllPromisifyMethods(obj: any): boolean {
  return 'then' in obj && 'catch' in obj && 'finally' in obj && 'resolve' in obj && 'reject' in obj
}

function hasNoPromisifyMethods(obj: any): boolean {
  return !('then' in obj) && !('catch' in obj) && !('finally' in obj) && !('resolve' in obj) && !('reject' in obj)
}

describe('promisify', () => {
  test('should promisify an object', async () => {
    const foo = { x: 1 }
    const pFoo = promisify(foo)

    expect(hasAllPromisifyMethods(pFoo)).toBe(true)
    expect(pFoo.x).toBe(1)

    setTimeout(() => {
      pFoo.x = 2
      pFoo.resolve()
    }, 0)

    await pFoo

    expect(hasNoPromisifyMethods(pFoo)).toBe(true)
    expect(pFoo.x).toBe(2)
  })

  test('should not promisify an already promisified object', async () => {
    const foo = { x: 1, [promisifySymbol]: true }
    const pFoo = promisify(foo)

    expect(pFoo).toBe(foo)
    expect(hasNoPromisifyMethods(pFoo)).toBe(true)
    expect(pFoo.x).toBe(1)
  })

  test('a promisified object should not be promisified again, but can be awaited twice', async () => {
    const foo = { x: 1 }
    const pFoo = promisify(foo)

    expect(pFoo).toBe(foo)
    expect(hasAllPromisifyMethods(pFoo)).toBe(true)
    expect(pFoo.x).toBe(1)

    const pFoo2 = promisify(pFoo)
    expect(pFoo2).toBe(pFoo)
    expect(hasAllPromisifyMethods(pFoo)).toBe(true)

    let ok1 = false
    let ok2 = false
    pFoo.then(() => { ok1 = true })
    pFoo2.then(() => { ok2 = true })

    setTimeout(() => {
      pFoo.x = 2
      pFoo2.resolve()
    }, 0)

    await pFoo2

    expect(ok1).toBe(true)
    expect(ok2).toBe(true)
    expect(hasNoPromisifyMethods(pFoo)).toBe(true)
    expect(pFoo.x).toBe(2)
  })
})
