import { describe, expect, test } from 'vitest'

import { computePenetration, dragPenetrationIntegration, dragPenetrationIntegrationLimit } from './drag'
import { DragMobile } from './drag.mobile'

describe('drag', () => {
  // Test the penetration integration and limit functions
  // https://www.desmos.com/calculator/g4jvkfr3xy
  test('formulae', () => {
    const velocity = 10
    const penetration = 0.25
    const deltaTime = 1

    expect(dragPenetrationIntegration(velocity, penetration, deltaTime))
      .approximately(5.41011, .00001)

    expect(dragPenetrationIntegration(velocity, penetration, 1.7))
      .approximately(6.53012, .00001)

    expect(dragPenetrationIntegrationLimit(velocity, penetration))
      .approximately(7.21347, .00001)

    {
      const position = 12
      const velocity = 10
      const desiredDestination = 18
      const penetration = computePenetration(velocity, desiredDestination - position)
      const destination = position + dragPenetrationIntegrationLimit(velocity, penetration)
      expect(destination)
        .approximately(desiredDestination, .00001)
    }
  })

  test('impossible', () => {
    // Invalid penetration values should return values greater than 1
    expect(computePenetration(1, -1))
      .toBeGreaterThan(1)
  })

  test('drag mobile', () => {
    const mobile = new DragMobile()

    mobile.position = 10
    mobile.velocity = 20
    mobile.setDragForDestination(20)

    expect(mobile.getDestination())
      .approximately(20, .00001)

    for (let seconds = 0; seconds < 10; seconds++)
      for (let i = 0; i < 60; i++)
        mobile.update(1 / 60)

    expect(mobile.position)
      .approximately(20, .0001)

    mobile.position = 10
    mobile.drag = .75
    mobile.setVelocityForDestination(20)

    expect(mobile.getDestination())
      .approximately(20, .00001)

    for (let seconds = 0; seconds < 10; seconds++)
      for (let i = 0; i < 60; i++)
        mobile.update(1 / 60)

    expect(mobile.position)
      .approximately(20, .0001)

    mobile.setDrag(.9, { timeSpan: .1 })
  })
})
