import { describe, expect, test } from 'vitest'

import { Float32Variable } from './variable'

describe('Float32Variable', () => {
  test('push and get', () => {
    const variable = new Float32Variable({ initialValue: 100, historySize: 5 })

    expect(variable.get(0)).toBe(100)

    variable.push(1)

    expect(variable.get(0)).toBe(1)

    variable.push(2)
    variable.push(3)

    expect(variable.get(0)).toBe(3)
    expect(variable.get(1)).toBe(2)
    expect(variable.get(2)).toBe(1)
    expect(variable.get(3)).toBe(100) // backstep exceeds count
  })

  test('history generator', () => {
    const variable = new Float32Variable({ historySize: 5 })

    variable.reset(10)
    variable.push(20)
    variable.push(30)

    const history1 = [...variable.history(5, { wrapMode: 'end' })]
    expect(history1).toEqual([30, 20, 10])

    const history2 = [...variable.history(5, { wrapMode: 'repeat' })]
    expect(history2).toEqual([30, 20, 10, 10, 10])
  })

  test('reset', () => {
    const variable = new Float32Variable({ historySize: 5 })

    variable.push(1)
    variable.push(2)

    variable.reset(42)

    expect(variable.get(0)).toBe(42)
    expect(variable.get(1)).toBe(42)
  })

  test('history that exceeds history size', () => {
    const variable = new Float32Variable({ historySize: 3 })

    variable.push(1)
    variable.push(2)
    variable.push(3)
    variable.push(4)

    const history = [...variable.history(5)]
    expect(history).toEqual([4, 3, 2])
  })

  test('backstep that exceeds count', () => {
    const variable = new Float32Variable({ initialValue: 100, historySize: 5 })

    variable.push(1)
    variable.push(2)

    expect(variable.get(10)).toBe(100) // initial value
  })

  test('count', () => {
    const variable = new Float32Variable({ historySize: 5 })

    expect(variable.state.count).toBe(1)

    variable.push(1)
    expect(variable.state.count).toBe(2)

    variable.push(2)
    variable.push(3)
    expect(variable.state.count).toBe(4)

    variable.reset(42)
    expect(variable.state.count).toBe(1)
  })

  test('history info', () => {
    const variable = new Float32Variable({ historySize: 5 })

    variable.reset(1)
    variable.push(2)
    variable.push(3)

    const info = variable.historyInfo()
    expect(info.min).toBe(1)
    expect(info.max).toBe(3)
    expect(info.sum).toBe(6)
    expect(info.actualCount).toBe(3)
    expect(info.average).toBe(2)
  })

  test('derivative', () => {
    const variable = new Float32Variable({ name: 'x', initialValue: 0, historySize: 5, derivativeCount: 2 })

    expect(variable.derivative).toBeDefined()
    expect(variable.derivative?.derivative).toBeDefined()
    expect(variable.derivative?.derivative?.derivative).toBeNull()

    expect(variable.name).toBe('x')
    expect(variable.derivative?.name).toBe("x'")
    expect(variable.derivative?.derivative?.name).toBe("x''")

    variable.push(1)
    variable.push(3)
    variable.push(6)

    expect(variable.get()).toBe(6)
    expect(variable.derivative?.get()).toBe(3) // first derivative: 6 - 3
    expect(variable.derivative?.derivative?.get()).toBe(1) // second derivative: 3 - 2
  })
})