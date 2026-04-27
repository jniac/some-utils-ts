import { describe, expect, test } from 'vitest'

import { computeLayout4 } from './computeLayout-4'
import { Space } from './Space'

const warningsTest = () => {
  const c_root = computeLayout4(new Space({
    direction: 'horizontal',
    size: 'fit-content',
    gap: '5%',
    padding: '5%',
  }))
  expect(c_root.gap.warningMask).not.toBe(0)
}

const nestedFitContentTest = () => {
  const spacing = 10
  const leafSize = [1, 3]
  const nestedCount = 10

  const root = new Space({
    size: 'fit-content',
    spacing,
  })

  let current = root
  for (let i = 0; i < nestedCount; i++) {
    const child = new Space({
      size: 'fit-content',
      spacing,
    })
    current.add(child)
    current = child
  }

  current.add({
    size: leafSize,
  })

  computeLayout4(root)
  expect(root.rect.width).toBe(leafSize[0] + spacing * (nestedCount + 1) * 2)
  expect(root.rect.height).toBe(leafSize[1] + spacing * (nestedCount + 1) * 2)
}

const circularDependencyDetectionTest = () => {
  const root = new Space({
    spacing: 10,
    size: 'fit-content',
  })
    .add(
      new Space({
        size: '100%',
      })
    )
  const c_root = computeLayout4(root)
  expect(c_root.treeWarningsCount()).toBe(4) // 2 (width, height) for circular dependency for each node (x2)
}

describe('computeLayout4', () => {
  test('warnings', warningsTest)
  test('nested fit-content', nestedFitContentTest)
  test('circular dependency detection', circularDependencyDetectionTest)
})
